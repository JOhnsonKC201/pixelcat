// The welcome half of the PR bot: one comment, once, on a contributor's first pull
// request, saying what will happen next so the wait for CI approval and review
// does not read as silence.
//
// It runs from `pull_request_target`, which executes the DEFAULT branch's copy of
// the workflow with a write token no matter where the PR came from. That is what
// lets it greet a fork PR. It is also why this job must never check out or run
// anything from the PR. This file comes from main, and the only PR data it reads
// are the author's login, the author's relationship to the repo, and the number.

const MARKER = '<!-- pixelpets-bot:welcome -->';

// People who are part of the repo do not need the tour.
const INSIDERS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

function welcomeBody(login, repoUrl) {
  return [
    MARKER,
    `Hi @${login}, thanks for opening your first pull request here.`,
    '',
    'What happens next:',
    '',
    '- CI runs the tests and boots the app on Windows and macOS. For a first pull request GitHub waits for a maintainer to approve the run, so a "workflow awaiting approval" notice is normal and not a rejection.',
    '- When CI finishes, this bot posts a results comment and keeps it updated on every push.',
    '- The maintainer is requested as a reviewer automatically.',
    '',
    `Before review, the quick self-check from [CONTRIBUTING.md](${repoUrl}/blob/main/CONTRIBUTING.md): \`npm test\` green, \`npm run lint\` clean, and if this touches drawing, a before and after crop from \`npm run poses:cat\`. Everything in pixelpets is original or procedural, so nothing copied from other pets, please.`,
  ].join('\n');
}

function shouldGreet({ pr, priorCount }) {
  if (!pr || !pr.user || !pr.user.login) return { greet: false, why: 'no author on the payload' };
  if (pr.user.type === 'Bot') return { greet: false, why: `${pr.user.login} is a bot` };
  if (INSIDERS.has(pr.author_association)) {
    return { greet: false, why: `${pr.user.login} is ${String(pr.author_association).toLowerCase()}` };
  }
  if (priorCount > 1) return { greet: false, why: `${pr.user.login} has ${priorCount} pull requests here` };
  return { greet: true, why: 'first pull request' };
}

// How many pull requests has this login opened here, counting the one just opened?
// The search index can lag a freshly opened PR, so 0 and 1 both mean "first".
async function countPullRequests({ github, owner, repo, login }) {
  const q = `repo:${owner}/${repo} is:pr author:${login}`;
  const { data } = await github.rest.search.issuesAndPullRequests({ q, per_page: 1 });
  return data.total_count;
}

function isOurs(comment) {
  return Boolean(comment && comment.user && comment.user.type === 'Bot'
    && typeof comment.body === 'string' && comment.body.includes(MARKER));
}

async function alreadyGreeted({ github, owner, repo, number }) {
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner, repo, issue_number: number, per_page: 100,
  });
  return comments.some(isOurs);
}

async function run({ github, context, core }) {
  const pr = context.payload.pull_request;
  const { owner, repo } = context.repo;

  const worthCounting = pr && pr.user && pr.user.login && pr.user.type !== 'Bot' && !INSIDERS.has(pr.author_association);
  const priorCount = worthCounting ? await countPullRequests({ github, owner, repo, login: pr.user.login }) : 0;

  const { greet, why } = shouldGreet({ pr, priorCount });
  if (!greet) {
    core.info(`no welcome: ${why}`);
    return;
  }
  if (await alreadyGreeted({ github, owner, repo, number: pr.number })) {
    core.info(`already welcomed on #${pr.number}`);
    return;
  }

  const body = welcomeBody(pr.user.login, `https://github.com/${owner}/${repo}`);
  await github.rest.issues.createComment({ owner, repo, issue_number: pr.number, body });
  core.info(`welcomed @${pr.user.login} on #${pr.number}`);
}

module.exports = { MARKER, INSIDERS, welcomeBody, shouldGreet, countPullRequests, isOurs, alreadyGreeted, run };
