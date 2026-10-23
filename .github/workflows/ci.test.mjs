import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

test('internal workflows are called and entry points expose only event triggers', () => {
  const directory = new URL('./', import.meta.url);
  const workflows = new Map(
    readdirSync(directory)
      .filter((file) => /\.ya?ml$/.test(file))
      .map((file) => [file, readFileSync(new URL(file, directory), 'utf8')])
  );
  const callers = new Map(
    [...workflows.keys()].map((file) => [file, new Set()])
  );
  for (const [file, source] of workflows) {
    for (const [, target] of source.matchAll(
      /^    uses: \.\/\.github\/workflows\/(\S+)$/gm
    )) {
      assert.ok(workflows.has(target), `${file}: missing ${target}`);
      assert.ok(target.startsWith('_'), `${file}: ${target} must be internal`);
      callers.get(target).add(file);
    }
  }
  for (const [file, source] of workflows) {
    const eventBlock = source.split('\non:\n')[1]?.split(/\n\S/)[0];
    const events = [...(eventBlock || '').matchAll(/^  ([\w_]+):/gm)].map(
      (match) => match[1]
    );
    if (file.startsWith('_')) {
      assert.deepEqual(events, ['workflow_call'], file);
      assert.ok(
        callers.get(file).size >= 1,
        `${file}: internal workflows must have a caller`
      );
    } else {
      assert.ok(
        events.length > 0 && !events.includes('workflow_call'),
        `${file}: an entry point needs an event trigger`
      );
    }
  }
});

function inlineRun(file, marker) {
  const workflow = readFileSync(new URL(file, import.meta.url), 'utf8');
  const block = workflow
    .match(/        run: \|\n(?:          .*\n|\n)+/g)
    ?.find((value) => value.includes(marker));
  assert.ok(block, `Missing run block in ${file}`);
  return block.replace('        run: |\n', '').replace(/^ {10}/gm, '');
}

function checkCi(needs) {
  return JSON.parse(
    execFileSync('bash', ['-c', inlineRun('_ci.yml', 'CI_NEEDS')], {
      env: { ...process.env, CI_NEEDS: JSON.stringify(needs) },
      encoding: 'utf8',
      stdio: 'pipe',
    })
  );
}

function ciResults() {
  return {
    'analyze-affected': {
      result: 'success',
      outputs: {
        'run-ui-storybook': 'false',
        'run-app-storybook': 'false',
        'run-prepare-test-db': 'true',
        'run-db-deploy': 'false',
        'run-backend-api': 'true',
        'run-e2e': 'false',
      },
    },
    'workflow-checks': { result: 'success' },
    'validate-affected-projects': { result: 'success' },
    storybook: { result: 'skipped' },
    'prepare-test-db': { result: 'success' },
    'test-db-deploy': { result: 'skipped' },
    'test-backend-api': { result: 'success' },
    'test-end-to-end': { result: 'skipped' },
  };
}

test('requires every applicable CI result, including missing, cancelled and skipped jobs', () => {
  assert.equal(checkCi(ciResults())['test-backend-api'], true);
  for (const result of ['skipped', 'cancelled', 'failure', undefined]) {
    const needs = ciResults();
    needs['test-backend-api'].result = result;
    assert.throws(() => checkCi(needs));
  }
  const unknownScope = ciResults();
  delete unknownScope['analyze-affected'].outputs['run-db-deploy'];
  assert.throws(() => checkCi(unknownScope));
});

test('rejects malformed CI job results', () => {
  for (const value of [null, [], 'success']) {
    assert.throws(() => checkCi(value), /needs must be a JSON object/);
  }
});

test('CI requires each selected workflow, while accepting explicit scope exclusions', () => {
  for (const [scope, job] of [
    ['run-ui-storybook', 'storybook'],
    ['run-app-storybook', 'storybook'],
    ['run-e2e', 'test-end-to-end'],
  ]) {
    const needs = ciResults();
    needs['analyze-affected'].outputs[scope] = 'true';
    needs[job].result = 'success';
    checkCi(needs);
    for (const result of ['failure', 'cancelled', 'skipped', undefined]) {
      const failed = structuredClone(needs);
      failed[job].result = result;
      assert.throws(() => checkCi(failed), undefined, `${job}: ${result}`);
    }
  }
  const excluded = ciResults();
  excluded['storybook'].result = 'success';
  assert.throws(() => checkCi(excluded));
});

test('Storybook jobs follow their selected scope and publishing waits for UI tests', () => {
  const workflow = readFileSync(
    new URL('_ci-storybook.yml', import.meta.url),
    'utf8'
  );
  for (const runUi of [false, true]) {
    for (const runApp of [false, true]) {
      for (const [job, expected] of [
        ['ui-storybook', runUi],
        ['publish-storybook', runUi],
        ['app-storybook', runApp],
      ]) {
        const expression = workflow
          .split(`\n  ${job}:\n`)[1]
          .match(/^    if: \$\{\{ (.+) \}\}$/m)[1]
          .replaceAll('inputs.run-ui', "inputs['run-ui']")
          .replaceAll('inputs.run-app', "inputs['run-app']");
        assert.equal(
          runInNewContext(expression, {
            inputs: { 'run-ui': runUi, 'run-app': runApp },
          }),
          expected
        );
      }
    }
  }
  assert.match(
    workflow.split('\n  publish-storybook:\n')[1],
    /^    needs: \[ui-storybook\]$/m
  );
});

test('E2E reports run after successful or failed shards, but not after skipped or cancelled shards', () => {
  const workflow = readFileSync(
    new URL('_ci-test-e2e.yml', import.meta.url),
    'utf8'
  );
  const expression = workflow
    .split('\n  merge-playwright-reports:\n')[1]
    .match(/^    if: \$\{\{ (.+) \}\}$/m)[1]
    .replaceAll('needs.test-end-to-end', "needs['test-end-to-end']");
  for (const cancelled of [false, true]) {
    for (const result of ['success', 'failure', 'skipped', 'cancelled']) {
      assert.equal(
        runInNewContext(expression, {
          always: () => true,
          cancelled: () => cancelled,
          needs: { 'test-end-to-end': { result } },
        }),
        !cancelled && ['success', 'failure'].includes(result)
      );
    }
  }
});

test('retry only known flaky failures, including their failed CI aggregate', () => {
  const directory = mkdtempSync(join(tmpdir(), 'tet-retry-tests-'));
  try {
    const log = join(directory, 'calls');
    writeFileSync(
      join(directory, 'gh'),
      `#!/usr/bin/env bash
set -eu
printf '%s\\n' "$*" >> "$MOCK_GH_LOG"
if [[ $1 == api ]]; then printf '%s' "$MOCK_FAILED_JOBS"; fi
`,
      { mode: 0o700 }
    );
    for (const [failures, retry] of [
      ['', false],
      ['ci / test-end-to-end / test-end-to-end (1)\nci / ci-complete', true],
      [
        'ci / test-end-to-end / test-end-to-end (2)\nci / test-end-to-end / test-end-to-end (5)\nci / ci-complete',
        true,
      ],
      ['ci / test-backend-api / test-backend-api', true],
      ['ci / ci-complete', false],
      ['ci / validate-affected-projects / validate-affected-projects', false],
      [
        'ci / test-end-to-end / test-end-to-end (1)\nci / validate-affected-projects / validate-affected-projects',
        false,
      ],
      ['ci / storybook / publish-storybook', false],
      [
        'ci / test-backend-api / test-backend-api\nci / storybook / publish-storybook\nci / ci-complete',
        false,
      ],
      ['ci / test-end-to-end / merge-playwright-reports', false],
      [
        'ci / test-end-to-end / test-end-to-end (1)\nci / test-end-to-end / merge-playwright-reports\nci / ci-complete',
        false,
      ],
      ['ci / test-backend-api / test-backend-api-extra', false],
      ['ci / workflow-checks\nci / ci-complete', false],
      [
        'ci / test-end-to-end / test-end-to-end (1)\nci / workflow-checks\nci / ci-complete',
        false,
      ],
    ]) {
      writeFileSync(log, '');
      execFileSync(
        'bash',
        ['-c', inlineRun('retry-flaky-jobs.yml', 'failed_jobs=')],
        {
          env: {
            ...process.env,
            PATH: `${directory}:${process.env.PATH}`,
            GH_TOKEN: 'test-token',
            REPO: 'example/repository',
            RUN_ID: '123',
            MOCK_GH_LOG: log,
            MOCK_FAILED_JOBS: failures,
          },
          stdio: 'pipe',
        }
      );
      assert.equal(
        readFileSync(log, 'utf8').includes(
          'run rerun 123 --failed --repo example/repository'
        ),
        retry,
        failures
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
