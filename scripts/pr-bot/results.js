// The results half of the PR bot: one comment per pull request saying what CI did,
// refreshed in place on every push instead of piling up a new comment each time.
//
// It runs from the `workflow_run` trigger, which executes the DEFAULT branch's copy
// of the workflow after CI completes, with a token that can write comments. That
// is the only route by which a fork PR can get a comment at all: the CI run for a
// fork carries a read-only token. The price of that token is that nothing here may
// trust what CI produced. The test output artifact was written while the PR's own
// code was running, so it is parsed with a strict pattern for four integers and
// nothing else is copied out of it. Job names and conclusions come from the
// Actions API, and the pull request is resolved from the run's head SHA through
// the API too, never from anything the PR could have written.

const fs = require('node:fs');
const path = require('node:path');

const MARKER = '<!-- pixelpets-bot:results -->';
const ARTIFACT_FILE = 'test-output.txt';

// Node's test runner prints its totals as `# tests 228` (TAP, the non-TTY default
// CI gets) or `ℹ tests 228` (spec reporter). Both are accepted; anything else on
// the line disqualifies it. The LAST match wins because the real totals come at
// the end, after any test that happened to print something similar.
const COUNT_LINE = /^(?:#|ℹ)\s+(tests|pass|fail|skipped)\s+(\d{1,7})$/;

function parseTestSummary(text) {
  if (typeof text !== 'string') return null;
  const found = {};
  for (const raw of text.split(/\r?\n/)) {
    const m = COUNT_LINE.exec(raw.trim());
    if (m) found[m[1]] = Number(m[2]);
  }
  const complete = ['tests', 'pass', 'fail'].every((k) => Number.isInteger(found[k]));
  if (!complete) return null;
  return { tests: found.tests, pass: found.pass, fail: found.fail, skipped: found.skipped || 0 };
}

const WORDS = {
  success: 'passed',
  failure: 'failed',
  cancelled: 'cancelled',
  skipped: 'skipped',
  timed_out: 'timed out',
  action_required: 'waiting for approval',
  neutral: 'neutral',
};

function describe(conclusion) {
  if (!conclusion) return 'still running';
  return WORDS[conclusion] || String(conclusion);
}

function shortSha(sha) {
  return String(sha || '').slice(0, 7);
}

function buildComment({ headSha, runUrl, jobs, summary }) {
  const notGreen = jobs.filter((j) => j.conclusion && j.conclusion !== 'success' && j.conclusion !== 'skipped');
  const verdict = jobs.length === 0
    ? 'no jobs reported'
    : notGreen.length === 0 ? 'all jobs passed' : `${notGreen.length} of ${jobs.length} jobs did not pass`;

  const lines = [
    MARKER,
    `**CI for ${shortSha(headSha)}: ${verdict}**`,
    '',
    '| Job | Result | Log |',
    '|---|---|---|',
    ...jobs.map((j) => `| ${j.name} | ${describe(j.conclusion)} | [open](${j.html_url}) |`),
    '',
  ];

  if (summary) {
    lines.push(`Tests: ${summary.pass} passed, ${summary.fail} failed, ${summary.skipped} skipped, ${summary.tests} total.`);
  } else {
    lines.push('Tests: no totals for this run. The test job did not get as far as reporting them, so its log above is the place to look.');
  }

  lines.push('', `This comment updates itself on every push. [Full run](${runUrl}).`);
  return lines.join('\n');
}

// Which pull request does this run belong to? Three sources, most direct first.
// The run payload lists pull requests for same-repo branches but is empty for
// forks, which is exactly the case the bot exists for, hence the API fallbacks.
async function findPullRequest({ github, owner, repo, run }) {
  const listed = run.pull_requests || [];
  const fromRun = listed.find((p) => p.head && p.head.sha === run.head_sha) || listed[0];
  if (fromRun) return fromRun.number;

  const { data: byCommit } = await github.rest.repos.listPullRequestsAssociatedWithCommit({
    owner, repo, commit_sha: run.head_sha,
  });
  const hit = byCommit.find((p) => p.head && p.head.sha === run.head_sha) || byCommit[0];
  if (hit) return hit.number;

  const headOwner = run.head_repository && run.head_repository.owner && run.head_repository.owner.login;
  if (headOwner && run.head_branch) {
    const { data: byHead } = await github.rest.pulls.list({
      owner, repo, state: 'open', head: `${headOwner}:${run.head_branch}`, per_page: 5,
    });
    if (byHead[0]) return byHead[0].number;
  }
  return null;
}

async function listJobs({ github, owner, repo, runId }) {
  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, {
    owner, repo, run_id: runId, filter: 'latest', per_page: 100,
  });
  return jobs.map((j) => ({ name: j.name, conclusion: j.conclusion, html_url: j.html_url }));
}

// Only a comment the Actions bot itself wrote is ever edited. Anyone can paste the
// marker into a comment of their own; without this check the bot would overwrite
// it, which is a small thing to be able to make a repo's bot do.
function isOurs(comment) {
  return Boolean(comment && comment.user && comment.user.type === 'Bot'
    && typeof comment.body === 'string' && comment.body.includes(MARKER));
}

async function upsertComment({ github, owner, repo, number, body }) {
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner, repo, issue_number: number, per_page: 100,
  });
  const mine = comments.find(isOurs);
  if (mine) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: mine.id, body });
    return 'updated';
  }
  await github.rest.issues.createComment({ owner, repo, issue_number: number, body });
  return 'created';
}

function readSummary(artifactDir) {
  if (!artifactDir) return null;
  const file = path.join(artifactDir, ARTIFACT_FILE);
  if (!fs.existsSync(file)) return null;
  return parseTestSummary(fs.readFileSync(file, 'utf8'));
}

async function run({ github, context, core, runId, artifactDir }) {
  const { owner, repo } = context.repo;
  const id = Number(runId);
  if (!Number.isInteger(id) || id <= 0) {
    core.setFailed(`run_id must be a positive integer, got ${JSON.stringify(runId)}`);
    return;
  }

  const { data: workflowRun } = await github.rest.actions.getWorkflowRun({ owner, repo, run_id: id });
  if (workflowRun.event !== 'pull_request') {
    core.info(`run ${id} was a ${workflowRun.event} run, nothing to comment on`);
    return;
  }

  const number = await findPullRequest({ github, owner, repo, run: workflowRun });
  if (!number) {
    core.info(`no pull request found for ${workflowRun.head_sha}, nothing to comment on`);
    return;
  }

  const jobs = await listJobs({ github, owner, repo, runId: id });
  const summary = readSummary(artifactDir);
  const body = buildComment({ headSha: workflowRun.head_sha, runUrl: workflowRun.html_url, jobs, summary });
  const what = await upsertComment({ github, owner, repo, number, body });
  core.info(`${what} the results comment on #${number}`);
}

module.exports = {
  MARKER, ARTIFACT_FILE, parseTestSummary, describe, buildComment,
  findPullRequest, listJobs, isOurs, upsertComment, readSummary, run,
};
