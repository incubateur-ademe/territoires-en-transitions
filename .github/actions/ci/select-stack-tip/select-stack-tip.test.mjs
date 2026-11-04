import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { getStackDiff, selectStackTip } from './select-stack-tip.mjs';

const repository = {
  id: 1,
  full_name: 'example/project',
  default_branch: 'main',
};
const branch = (ref, repo = repository) => ({ ref, repo, sha: `${ref}-sha` });
const pr = (number, head, base, overrides = {}) => ({
  number,
  state: 'open',
  draft: false,
  head: branch(head),
  base: branch(base),
  ...overrides,
});
const root = pr(30, 'root', 'main');
const middle = pr(10, 'middle', 'root');
const tip = pr(20, 'tip', 'middle');

function select(
  current,
  pulls,
  {
    comparisons = {},
    runs = {},
    jobs = [
      { name: 'select-stack-tip', conclusion: 'success' },
      { name: 'ci / analyze-affected', conclusion: 'success' },
    ],
    fail = false,
  } = {}
) {
  const calls = [];
  const result = selectStackTip(
    { repository, pull_request: current },
    (url, ...args) => {
      calls.push({ url, args });
      if (fail) throw new Error('API unavailable');
      if (url.includes('/pulls?')) return pulls.map((pull) => [pull]);
      if (url.includes('/compare/')) {
        const sha = url.split('...')[1].split('?')[0];
        return { status: comparisons[sha] ?? 'ahead' };
      }
      if (url.includes('/runs?')) {
        const ref = new URLSearchParams(url.split('?')[1]).get('branch');
        const candidate = pulls.find((pull) => pull.head.ref === ref);
        return {
          workflow_runs: runs[ref] ?? [
            {
              id: 100,
              status: 'in_progress',
              conclusion: null,
              pull_requests: [{ number: candidate.number }],
            },
          ],
        };
      }
      if (url.includes('/jobs?')) return [{ jobs }];
      throw new Error(`Unexpected API call: ${url}`);
    }
  );
  return { ...result, calls };
}

test('standalone PRs and the tip run; ancestors use the furthest ready descendant', () => {
  assert.equal(select(root, [root]).runCi, true);
  const pulls = [middle, tip, root];
  assert.equal(select(tip, pulls).runCi, true);
  for (const current of [root, middle]) {
    const result = select(current, pulls);
    assert.equal(result.runCi, false);
    assert.match(result.reason, /#20 /);
    assert.deepEqual(result.calls[0].args, ['--paginate', '--slurp']);
  }
});

test('draft tips leave the last ready PR selected, including across draft intermediates', () => {
  const draftTip = { ...tip, draft: true };
  assert.equal(select(middle, [root, middle, draftTip]).runCi, true);
  assert.match(select(root, [root, middle, draftTip]).reason, /#10 /);
  const draftMiddle = { ...middle, draft: true };
  assert.match(select(root, [root, draftMiddle, tip]).reason, /#20 /);
  assert.equal(select(draftMiddle, [root, draftMiddle, tip]).runCi, false);
});

test('closed and retargeted descendants do not suppress their former parent', () => {
  assert.equal(
    select(root, [root, { ...middle, state: 'closed' }]).runCi,
    true
  );
  assert.equal(
    select(root, [root, { ...middle, base: branch('main') }]).runCi,
    true
  );
});

test('each leaf of a branching stack runs independently', () => {
  const sibling = pr(40, 'sibling', 'root');
  const pulls = [root, middle, tip, sibling];
  assert.equal(select(tip, pulls).runCi, true);
  assert.equal(select(sibling, pulls).runCi, true);
  assert.equal(select(root, pulls).runCi, false);
});

test('forks and identical branch names in other repositories remain independent', () => {
  const fork = { id: 2, full_name: 'someone/project' };
  const forkRoot = { ...root, head: branch('root', fork) };
  assert.equal(select(forkRoot, [forkRoot, middle]).runCi, true);
  assert.equal(
    select(root, [root, { ...middle, head: branch('middle', fork) }]).runCi,
    true
  );
  assert.equal(
    select(root, [root, { ...middle, base: branch('root', fork) }]).runCi,
    true
  );
});

test('new ancestor commits still run until a descendant contains them', () => {
  for (const status of ['behind', 'diverged', 'unknown']) {
    assert.equal(
      select(root, [root, middle], {
        comparisons: { 'middle-sha': status },
      }).runCi,
      true
    );
  }
  assert.equal(
    select(root, [root, middle], {
      comparisons: { 'middle-sha': 'identical' },
    }).runCi,
    false
  );
});

test('a descendant needs an actual CI run for this head and PR', () => {
  assert.equal(
    select(root, [root, middle], { runs: { middle: [] } }).runCi,
    true
  );
  for (const [status, conclusion] of [
    ['waiting', null],
    ['completed', 'cancelled'],
    ['completed', 'skipped'],
    ['completed', 'action_required'],
  ]) {
    assert.equal(
      select(root, [root, middle], {
        runs: {
          middle: [
            {
              status,
              conclusion,
              pull_requests: [{ number: middle.number }],
            },
          ],
        },
      }).runCi,
      true
    );
  }
  assert.equal(
    select(root, [root, middle], {
      runs: {
        middle: [
          {
            status: 'in_progress',
            pull_requests: [{ number: 999 }],
          },
        ],
      },
    }).runCi,
    true
  );
  const result = select(root, [root, middle]);
  const url = result.calls.find((call) => call.url.includes('/runs?')).url;
  assert.equal(
    new URLSearchParams(url.split('?')[1]).get('head_sha'),
    middle.head.sha
  );
});

test('queued, successful and failed descendant runs keep validation on the descendant', () => {
  for (const [status, conclusion] of [
    ['queued', null],
    ['completed', 'success'],
    ['completed', 'failure'],
  ]) {
    assert.equal(
      select(root, [root, middle], {
        runs: {
          middle: [
            {
              status,
              conclusion,
              pull_requests: [{ number: middle.number }],
            },
          ],
        },
      }).runCi,
      false
    );
  }
});

test('API failures preserve CI and cyclic branch links terminate', () => {
  assert.equal(select(root, [root, middle], { fail: true }).runCi, true);
  const cycleRoot = { ...root, base: branch('middle') };
  assert.equal(select(cycleRoot, [cycleRoot, middle]).runCi, true);
});

test('successful runs that only skipped CI do not cover an ancestor', () => {
  const runs = {
    middle: [
      {
        id: 100,
        status: 'completed',
        conclusion: 'success',
        pull_requests: [{ number: middle.number }],
      },
    ],
  };
  assert.equal(
    select(root, [root, middle], {
      runs,
      jobs: [
        { name: 'select-stack-tip', conclusion: 'success' },
        { name: 'ci', conclusion: 'skipped' },
      ],
    }).runCi,
    true
  );
});

test('older workflow revisions without full-stack scope do not cover an ancestor', () => {
  assert.equal(
    select(root, [root, middle], {
      jobs: [{ name: 'ci / analyze-affected', conclusion: 'success' }],
    }).runCi,
    true
  );
});

test('a docs-only tip includes ancestor code in its Nx scope', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'stack-diff-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_SYSTEM: '/dev/null',
        GIT_AUTHOR_NAME: 'CI Test',
        GIT_AUTHOR_EMAIL: 'ci@example.test',
        GIT_COMMITTER_NAME: 'CI Test',
        GIT_COMMITTER_EMAIL: 'ci@example.test',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '--initial-branch=main');
  git('commit', '--allow-empty', '-m', 'base');
  const base = git('rev-parse', 'HEAD');
  git('update-ref', 'refs/remotes/origin/main', base);
  writeFileSync(join(directory, 'guide.md'), 'Documentation');
  git('add', '.');
  git('commit', '-m', 'docs');
  assert.deepEqual(getStackDiff('main', git), { base, hasCodeChanges: false });
  writeFileSync(join(directory, 'code.js'), 'export const value = 1;');
  git('add', '.');
  git('commit', '-m', 'ancestor code');
  writeFileSync(join(directory, 'guide.md'), 'More documentation');
  git('add', '.');
  git('commit', '-m', 'docs-only tip');
  assert.deepEqual(getStackDiff('main', git), { base, hasCodeChanges: true });
  // The default branch can advance independently without pulling its changes
  // into the stack's affected-project diff.
  git('checkout', '-b', 'default-update', base);
  writeFileSync(join(directory, 'unrelated.js'), 'export const unrelated = 1;');
  git('add', '.');
  git('commit', '-m', 'unrelated main change');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  git('checkout', 'main');
  assert.deepEqual(getStackDiff('main', git), { base, hasCodeChanges: true });
});
