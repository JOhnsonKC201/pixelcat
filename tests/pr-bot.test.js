// Tests for the PR bot (scripts/pr-bot/* and .github/workflows/pull-request-bot.yml).
//
// The pure pieces are exercised directly. The GitHub-touching pieces run against a
// small fake of the octokit surface they use, recording every write so a test can
// say exactly what would have hit GitHub. The workflow files get structural checks
// that pin the security model the bot depends on: every action pinned to a commit,
// and no checkout or execution of pull request code in a job that holds a write
// token. Those are the properties a future edit is most likely to erode by
// accident, and the ones a public repo can least afford to lose.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const results = require('../scripts/pr-bot/results.js');
const welcome = require('../scripts/pr-bot/welcome.js');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const BOT_USER = { login: 'github-actions[bot]', type: 'Bot' };
const HUMAN = { login: 'someone', type: 'User' };

function fakeGithub({ comments = [], search = 0, run = {}, jobs = [], byCommit = [], byHead = [] } = {}) {
  const calls = [];
  const github = {
    paginate: async (fn, params) => (await fn(params)).data,
    rest: {
      issues: {
        listComments: async () => ({ data: comments }),
        createComment: async (p) => { calls.push(['create', p]); return { data: {} }; },
        updateComment: async (p) => { calls.push(['update', p]); return { data: {} }; },
      },
      search: {
        issuesAndPullRequests: async (p) => { calls.push(['search', p]); return { data: { total_count: search } }; },
      },
      actions: {
        getWorkflowRun: async () => ({ data: run }),
        listJobsForWorkflowRun: async () => ({ data: jobs }),
      },
      repos: { listPullRequestsAssociatedWithCommit: async () => ({ data: byCommit }) },
      pulls: { list: async () => ({ data: byHead }) },
    },
  };
  return { github, calls };
}

function fakeCore() {
  const log = [];
  return { log, info: (m) => log.push(m), setFailed: (m) => { throw new Error(m); } };
}

const REPO = { owner: 'o', repo: 'r' };
const ctx = (payload = {}) => ({ repo: REPO, payload });

// ---- results: parsing the test totals ---------------------------------------

test('parseTestSummary reads the TAP totals node prints when stdout is not a TTY', () => {
  const s = results.parseTestSummary('ok 1 - a\nok 2 - b\n# tests 228\n# suites 0\n# pass 224\n# fail 0\n# skipped 4\n# todo 0\n');
  assert.deepStrictEqual(s, { tests: 228, pass: 224, fail: 0, skipped: 4 });
});

test('parseTestSummary reads the spec-reporter totals too, with CRLF endings', () => {
  const s = results.parseTestSummary('✔ a (1ms)\r\nℹ tests 10\r\nℹ pass 9\r\nℹ fail 1\r\n');
  assert.deepStrictEqual(s, { tests: 10, pass: 9, fail: 1, skipped: 0 });
});

test('parseTestSummary refuses anything that is not exactly a count line', () => {
  // A PR's test could print whatever it likes; only clean integer lines count.
  assert.strictEqual(results.parseTestSummary('# tests 1; rm -rf\n# pass 1\n# fail 0\n'), null);
  assert.strictEqual(results.parseTestSummary('ok 3 - # tests 5\n# pass 1\n# fail 0\n'), null);
  assert.strictEqual(results.parseTestSummary('# tests 99999999999\n# pass 1\n# fail 0\n'), null);
  assert.strictEqual(results.parseTestSummary(''), null);
  assert.strictEqual(results.parseTestSummary(undefined), null);
});

test('parseTestSummary takes the last totals, which is where node puts the real ones', () => {
  const s = results.parseTestSummary('# tests 1\n# pass 1\n# fail 0\n# tests 40\n# pass 39\n# fail 1\n');
  assert.deepStrictEqual(s, { tests: 40, pass: 39, fail: 1, skipped: 0 });
});

test('readSummary returns null for a missing artifact and totals for a present one', () => {
  assert.strictEqual(results.readSummary(path.join(os.tmpdir(), 'pr-bot-does-not-exist')), null);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-bot-'));
  fs.writeFileSync(path.join(dir, results.ARTIFACT_FILE), '# tests 2\n# pass 2\n# fail 0\n');
  assert.deepStrictEqual(results.readSummary(dir), { tests: 2, pass: 2, fail: 0, skipped: 0 });
});

// ---- results: the comment ------------------------------------------------------

const JOBS = [
  { name: 'test', conclusion: 'success', html_url: 'https://x/j/1' },
  { name: 'boot (windows-latest)', conclusion: 'failure', html_url: 'https://x/j/2' },
  { name: 'boot (macos-latest)', conclusion: null, html_url: 'https://x/j/3' },
];

test('buildComment carries the marker, one row per job, the totals and the run link', () => {
  const body = results.buildComment({
    headSha: 'abcdef0123456789', runUrl: 'https://x/run/9', jobs: JOBS,
    summary: { tests: 228, pass: 224, fail: 0, skipped: 4 },
  });
  assert.ok(body.startsWith(results.MARKER));
  assert.match(body, /CI for abcdef0: 1 of 3 jobs did not pass/);
  assert.match(body, /\| test \| passed \| \[open\]\(https:\/\/x\/j\/1\) \|/);
  assert.match(body, /\| boot \(windows-latest\) \| failed \|/);
  assert.match(body, /\| boot \(macos-latest\) \| still running \|/);
  assert.match(body, /Tests: 224 passed, 0 failed, 4 skipped, 228 total\./);
  assert.match(body, /\[Full run\]\(https:\/\/x\/run\/9\)/);
});

test('buildComment says all jobs passed only when every finished job succeeded', () => {
  const green = JOBS.map((j) => ({ ...j, conclusion: 'success' }));
  assert.match(results.buildComment({ headSha: 'a', runUrl: 'u', jobs: green, summary: null }), /all jobs passed/);
  assert.match(results.buildComment({ headSha: 'a', runUrl: 'u', jobs: [], summary: null }), /no jobs reported/);
});

test('buildComment explains a missing summary instead of inventing zeros', () => {
  const body = results.buildComment({ headSha: 'a', runUrl: 'u', jobs: JOBS, summary: null });
  assert.match(body, /Tests: no totals for this run/);
  assert.doesNotMatch(body, /0 passed/);
});

// ---- results: finding the PR and upserting ----------------------------------

test('findPullRequest prefers the run payload, then the commit lookup, then the head branch', async () => {
  const base = { head_sha: 'S', head_branch: 'fix', head_repository: { owner: { login: 'forker' } } };

  const { github: g1 } = fakeGithub();
  assert.strictEqual(await results.findPullRequest({ github: g1, ...REPO, run: { ...base, pull_requests: [{ number: 7, head: { sha: 'S' } }] } }), 7);

  const { github: g2 } = fakeGithub({ byCommit: [{ number: 8, head: { sha: 'S' } }] });
  assert.strictEqual(await results.findPullRequest({ github: g2, ...REPO, run: { ...base, pull_requests: [] } }), 8);

  const { github: g3 } = fakeGithub({ byHead: [{ number: 9 }] });
  assert.strictEqual(await results.findPullRequest({ github: g3, ...REPO, run: { ...base, pull_requests: [] } }), 9);

  const { github: g4 } = fakeGithub();
  assert.strictEqual(await results.findPullRequest({ github: g4, ...REPO, run: { ...base, pull_requests: [] } }), null);
});

test('upsertComment creates once, then edits its own comment in place', async () => {
  const fresh = fakeGithub();
  assert.strictEqual(await results.upsertComment({ github: fresh.github, ...REPO, number: 3, body: 'B' }), 'created');
  assert.deepStrictEqual(fresh.calls, [['create', { ...REPO, issue_number: 3, body: 'B' }]]);

  const existing = fakeGithub({ comments: [{ id: 42, user: BOT_USER, body: `${results.MARKER}\nold` }] });
  assert.strictEqual(await results.upsertComment({ github: existing.github, ...REPO, number: 3, body: 'B' }), 'updated');
  assert.deepStrictEqual(existing.calls, [['update', { ...REPO, comment_id: 42, body: 'B' }]]);
});

test('upsertComment never edits a human comment that merely contains the marker', async () => {
  const { github, calls } = fakeGithub({ comments: [{ id: 5, user: HUMAN, body: `${results.MARKER} gotcha` }] });
  assert.strictEqual(await results.upsertComment({ github, ...REPO, number: 3, body: 'B' }), 'created');
  assert.strictEqual(calls[0][0], 'create');
});

test('results.run rejects a run id that is not a positive integer', async () => {
  const { github } = fakeGithub();
  await assert.rejects(
    () => results.run({ github, context: ctx(), core: fakeCore(), runId: 'abc' }),
    /run_id must be a positive integer/,
  );
});

test('results.run leaves non-PR runs alone and comments on PR runs', async () => {
  const push = fakeGithub({ run: { event: 'push', head_sha: 'S' } });
  await results.run({ github: push.github, context: ctx(), core: fakeCore(), runId: '12' });
  assert.deepStrictEqual(push.calls, []);

  const pr = fakeGithub({
    run: { event: 'pull_request', head_sha: 'S', html_url: 'https://x/run/12', pull_requests: [{ number: 4, head: { sha: 'S' } }] },
    jobs: JOBS,
  });
  const core = fakeCore();
  await results.run({ github: pr.github, context: ctx(), core, runId: '12' });
  assert.strictEqual(pr.calls.length, 1);
  assert.strictEqual(pr.calls[0][0], 'create');
  assert.strictEqual(pr.calls[0][1].issue_number, 4);
  assert.match(pr.calls[0][1].body, /CI for S: 1 of 3 jobs did not pass/);
  assert.match(core.log.join('\n'), /created the results comment on #4/);
});

// ---- welcome -----------------------------------------------------------------------

test('shouldGreet greets a first pull request and nobody else', () => {
  const pr = (extra) => ({ number: 1, user: { login: 'new', type: 'User' }, author_association: 'NONE', ...extra });
  assert.strictEqual(welcome.shouldGreet({ pr: pr(), priorCount: 0 }).greet, true);
  assert.strictEqual(welcome.shouldGreet({ pr: pr(), priorCount: 1 }).greet, true);
  assert.strictEqual(welcome.shouldGreet({ pr: pr(), priorCount: 2 }).greet, false);
  assert.strictEqual(welcome.shouldGreet({ pr: pr({ user: { login: 'dependabot[bot]', type: 'Bot' } }), priorCount: 0 }).greet, false);
  assert.strictEqual(welcome.shouldGreet({ pr: pr({ author_association: 'OWNER' }), priorCount: 0 }).greet, false);
  assert.strictEqual(welcome.shouldGreet({ pr: pr({ author_association: 'COLLABORATOR' }), priorCount: 0 }).greet, false);
  assert.strictEqual(welcome.shouldGreet({ pr: undefined, priorCount: 0 }).greet, false);
});

test('welcomeBody addresses the author and links the contributing guide in this repo', () => {
  const body = welcome.welcomeBody('new', 'https://github.com/o/r');
  assert.ok(body.startsWith(welcome.MARKER));
  assert.match(body, /Hi @new, thanks for opening your first pull request/);
  assert.match(body, /https:\/\/github\.com\/o\/r\/blob\/main\/CONTRIBUTING\.md/);
  assert.match(body, /awaiting approval/);
});

test('welcome.run greets a first-timer exactly once and asks GitHub how many PRs they have', async () => {
  const payload = { pull_request: { number: 11, user: { login: 'new', type: 'User' }, author_association: 'FIRST_TIME_CONTRIBUTOR' } };

  const first = fakeGithub({ search: 1 });
  await welcome.run({ github: first.github, context: ctx(payload), core: fakeCore() });
  assert.strictEqual(first.calls[0][0], 'search');
  assert.strictEqual(first.calls[0][1].q, 'repo:o/r is:pr author:new');
  assert.strictEqual(first.calls[1][0], 'create');
  assert.strictEqual(first.calls[1][1].issue_number, 11);
  assert.match(first.calls[1][1].body, /@new/);

  const again = fakeGithub({ search: 1, comments: [{ id: 1, user: BOT_USER, body: welcome.MARKER }] });
  await welcome.run({ github: again.github, context: ctx(payload), core: fakeCore() });
  assert.ok(!again.calls.some((c) => c[0] === 'create'), 'a re-run must not post a second welcome');
});

test('welcome.run skips insiders and bots without even searching', async () => {
  const owner = fakeGithub({ search: 1 });
  await welcome.run({ github: owner.github, context: ctx({ pull_request: { number: 1, user: { login: 'me', type: 'User' }, author_association: 'OWNER' } }), core: fakeCore() });
  assert.deepStrictEqual(owner.calls, []);

  const bot = fakeGithub({ search: 0 });
  await welcome.run({ github: bot.github, context: ctx({ pull_request: { number: 2, user: { login: 'dependabot[bot]', type: 'Bot' }, author_association: 'CONTRIBUTOR' } }), core: fakeCore() });
  assert.deepStrictEqual(bot.calls, []);
});

// ---- the workflows themselves -------------------------------------------------

const WORKFLOW_DIR = path.join(ROOT, '.github', 'workflows');
const workflows = fs.readdirSync(WORKFLOW_DIR).filter((f) => /\.ya?ml$/.test(f));
const BOT_WORKFLOW = '.github/workflows/pull-request-bot.yml';

test('every action in every workflow is pinned to a full commit SHA with a version comment', () => {
  // Dependabot rewrites the SHA and the comment together (see .github/dependabot.yml),
  // so the pin stays exact. A floating tag would quietly reintroduce supply-chain risk.
  const uses = /^\s*-?\s*uses:\s*(\S+)(.*)$/gm;
  for (const file of workflows) {
    const text = fs.readFileSync(path.join(WORKFLOW_DIR, file), 'utf8');
    let m; let seen = 0;
    while ((m = uses.exec(text))) {
      seen += 1;
      assert.match(m[1], /@[0-9a-f]{40}$/, `${file}: "${m[1]}" is not pinned to a commit`);
      assert.match(m[2], /#\s*v\d/, `${file}: "${m[1]}" has no version comment for Dependabot to maintain`);
    }
    assert.ok(seen > 0, `${file}: no uses: lines found, pattern drift?`);
  }
});

test('the bot workflow never checks out or executes pull request code', () => {
  // Judged on code lines only: the header comment is allowed to talk about npm.
  const code = read(BOT_WORKFLOW).split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
  assert.match(code, /^\s+pull_request_target:/m, 'the welcome job relies on pull_request_target');
  assert.match(code, /^\s+workflow_run:/m, 'the results job relies on workflow_run');
  // No checkout of a PR ref: the base branch default is the whole safety story.
  assert.doesNotMatch(code, /ref:\s*\$\{\{[^}]*(head_ref|pull_request\.head|head\.sha|head_sha)/, 'a PR ref is being checked out');
  assert.doesNotMatch(code, /\brepository:\s*\$\{\{[^}]*head_repository/, 'a PR repository is being checked out');
  // Nothing from the tree is ever run: no npm, no node script, no run: steps at all.
  assert.doesNotMatch(code, /^\s+run:/m, 'a run: step appeared in a write-token workflow');
  assert.doesNotMatch(code, /\bnpm\b/, 'npm appeared in a write-token workflow');
  // Write scope is limited to comments; contents stays read-only.
  assert.match(code, /^permissions:\n(?: {2}.+\n)* {2}pull-requests: write/m);
  assert.doesNotMatch(code, /contents:\s*write/);
});

test('CI uploads the raw test output the results job reads, with pipefail on', () => {
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /npm test 2>&1 \| tee test-output\.txt\n\s+shell: bash/, 'the tee step needs shell: bash or a red npm test goes green');
  assert.match(ci, /name: test-output\n\s+path: test-output\.txt/);
  assert.match(ci, /if: always\(\)\n\s+uses: actions\/upload-artifact/);
});
