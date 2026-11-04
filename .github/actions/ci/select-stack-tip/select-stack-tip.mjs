import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function githubApi(endpoint, ...args) {
  return JSON.parse(
    execFileSync('gh', ['api', endpoint, ...args], {
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 20 * 1024 * 1024,
    })
  );
}

// Repository identity matters: an unrelated fork can use the same branch name.
function sameBranch(left, right) {
  return left.repo?.id === right.repo?.id && left.ref === right.ref;
}

export function selectStackTip(event, api = githubApi) {
  const current = event.pull_request;
  const repository = event.repository;
  if (current.draft || current.state !== 'open') {
    return {
      runCi: false,
      reason: 'This PR is not open and ready for review.',
    };
  }
  if (current.head.repo?.id !== repository.id) {
    return { runCi: true, reason: 'Fork PRs run independently.' };
  }

  try {
    const prefix = `repos/${repository.full_name}`;
    const pullRequests = api(
      `${prefix}/pulls?state=open&per_page=100`,
      '--paginate',
      '--slurp'
    )
      .flat()
      .filter(
        (pr) => pr.state === 'open' && pr.head.repo?.id === repository.id
      );
    const descendants = [];
    const visited = new Set([current.number]);
    const pending = [current];
    while (pending.length > 0) {
      const parent = pending.shift();
      for (const pr of pullRequests) {
        if (pr.number === current.number && sameBranch(pr.base, parent.head)) {
          return {
            runCi: true,
            reason: 'Cyclic stack links; running CI conservatively.',
          };
        }
        if (!visited.has(pr.number) && sameBranch(pr.base, parent.head)) {
          visited.add(pr.number);
          descendants.push(pr);
          // A draft can sit between two ready PRs in a stack.
          pending.push(pr);
        }
      }
    }

    // Prefer the furthest ready descendant; never rely on PR creation order.
    for (const descendant of descendants.reverse()) {
      if (descendant.draft) continue;
      const comparison = api(
        `${prefix}/compare/${current.head.sha}...${descendant.head.sha}?per_page=1`
      );
      if (!['ahead', 'identical'].includes(comparison.status)) continue;

      // A conflicting PR, a skipped commit or a run awaiting approval must not
      // suppress its ancestors. Require an actual CI run for this exact head.
      const query = new URLSearchParams({
        event: 'pull_request',
        branch: descendant.head.ref,
        head_sha: descendant.head.sha,
        per_page: '1',
      });
      const { workflow_runs: runs } = api(
        `${prefix}/actions/workflows/pull-request-ci.yml/runs?${query}`
      );
      const run = runs[0];
      if (
        !run?.pull_requests.some((pr) => pr.number === descendant.number) ||
        !['queued', 'in_progress', 'completed'].includes(run.status) ||
        (run.status === 'completed' &&
          !['success', 'failure', 'timed_out'].includes(run.conclusion))
      ) {
        continue;
      }
      const jobs = api(
        `${prefix}/actions/runs/${run.id}/jobs?per_page=100`,
        '--paginate',
        '--slurp'
      ).flatMap((page) => page.jobs);
      // Older workflow revisions only test the immediate PR diff. During
      // rollout, keep ancestors running until their descendant uses this gate.
      if (!jobs.some((job) => job.name === 'select-stack-tip')) continue;
      if (run.status === 'completed') {
        // A successful gate-only run is not coverage: its own covering tip may
        // since have been closed, drafted or cancelled.
        if (
          !jobs.some(
            (job) =>
              job.name === 'ci / analyze-affected' &&
              ['success', 'failure', 'timed_out'].includes(job.conclusion)
          )
        )
          continue;
      }

      return {
        runCi: false,
        reason: `CI is covered by ready descendant #${descendant.number} (run ${run.id}).`,
      };
    }
    return {
      runCi: true,
      reason: 'No ready descendant has CI covering this head.',
    };
  } catch {
    // API errors must cost an extra run, never silently remove validation.
    return {
      runCi: true,
      reason: 'Stack lookup failed; running CI conservatively.',
    };
  }
}

export function getStackDiff(
  defaultBranch,
  git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
) {
  const base = git('merge-base', `origin/${defaultBranch}`, 'HEAD');
  const files = git('diff', '--name-only', '-z', base, 'HEAD').split('\0');
  return {
    base,
    hasCodeChanges: files.some((file) => file && !file.endsWith('.md')),
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const diff = getStackDiff(event.repository.default_branch);
  const selection = diff.hasCodeChanges
    ? selectStackTip(event)
    : { runCi: false, reason: 'The full stack only changes Markdown files.' };
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `run-ci=${selection.runCi}\nnx-base=${diff.base}\n`
  );
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${selection.reason}\n`);
  console.log(selection.reason);
}
