import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { getCiFailure } from './check-ci-status.mjs';
import { selectCiMode } from './select-ci-mode.mjs';

function stackedEvent(base = 'parent', trunk = 'main') {
  return {
    pull_request: {
      base: { ref: base },
      stack: { number: 42, position: 2, size: 3, base: { ref: trunk } },
    },
  };
}

function successfulNeeds() {
  return {
    'analyze-affected': {
      result: 'success',
      outputs: {
        'ci-mode': 'full',
        'run-ui-storybook': 'false',
        'run-app-storybook': 'false',
        'run-prepare-test-db': 'false',
        'run-db-deploy': 'false',
        'run-backend-api': 'false',
        'run-e2e': 'false',
      },
    },
    'validate-affected-projects': { result: 'success' },
    storybook: { result: 'skipped' },
    'prepare-test-db': { result: 'skipped' },
    'test-db-deploy': { result: 'skipped' },
    'test-backend-api': { result: 'skipped' },
    'test-end-to-end': { result: 'skipped' },
  };
}

test('ordinary PRs, including manually chained branches, keep full CI', () => {
  for (const stack of [undefined, null]) {
    const event = stackedEvent();
    event.pull_request.stack = stack;
    assert.equal(selectCiMode('pull_request', event), 'full');
  }
});

test('only native upper layers defer expensive checks', () => {
  const event = stackedEvent();
  assert.equal(selectCiMode('pull_request', event), 'deferred');
  event.pull_request.stack.position = 3;
  assert.equal(selectCiMode('pull_request', event), 'deferred');
});

test('promotion runs full CI even when the original position is greater than 1', () => {
  const event = stackedEvent();
  assert.equal(selectCiMode('pull_request', event), 'deferred');
  event.pull_request.base.ref = 'main';
  assert.equal(selectCiMode('pull_request', event), 'full');
});

test('the native trunk may be a release branch', () => {
  assert.equal(
    selectCiMode('pull_request', stackedEvent('release', 'release')),
    'full',
  );
  assert.equal(
    selectCiMode('pull_request', stackedEvent('parent', 'release')),
    'deferred',
  );
});

test('removing stack membership restores full validation', () => {
  const event = stackedEvent();
  delete event.pull_request.stack;
  assert.equal(selectCiMode('pull_request', event), 'full');
});

test('missing or malformed native metadata falls back to full CI', () => {
  const valid = stackedEvent().pull_request.stack;
  for (const stack of [
    {},
    { ...valid, number: 0 },
    { ...valid, number: '42' },
    { ...valid, position: undefined },
    { ...valid, position: 0 },
    { ...valid, position: 4 },
    { ...valid, size: undefined },
    { ...valid, base: undefined },
    { ...valid, base: { ref: '' } },
  ]) {
    const event = stackedEvent();
    event.pull_request.stack = stack;
    assert.equal(selectCiMode('pull_request', event), 'full');
  }
  const event = stackedEvent();
  delete event.pull_request.base;
  assert.equal(selectCiMode('pull_request', event), 'full');
});

test('main pushes, manual branch runs and reruns always validate fully', () => {
  for (const name of ['push', 'workflow_dispatch']) {
    assert.equal(selectCiMode(name, {}), 'full');
    assert.equal(selectCiMode(name, stackedEvent()), 'full');
  }
  assert.equal(selectCiMode('pull_request', stackedEvent(), 2), 'full');
});

test('checks outside the affected scope may be skipped', () => {
  assert.equal(getCiFailure(successfulNeeds()), null);
});

test('deferred validation blocks the merge even when all fast checks passed', () => {
  const needs = successfulNeeds();
  needs['analyze-affected'].outputs['ci-mode'] = 'deferred';
  assert.match(getCiFailure(needs), /CI complète différée/);
});

test('missing and invalid modes cannot publish a successful required check', () => {
  for (const mode of [undefined, '', 'invalid']) {
    const needs = successfulNeeds();
    needs['analyze-affected'].outputs['ci-mode'] = mode;
    assert.match(getCiFailure(needs), /absent ou invalide/);
  }
});

test('failed and cancelled checks block the merge, including during deferral', () => {
  for (const result of ['failure', 'cancelled']) {
    for (const mode of ['full', 'deferred']) {
      const needs = successfulNeeds();
      needs['analyze-affected'].outputs['ci-mode'] = mode;
      needs['validate-affected-projects'].result = result;
      assert.match(getCiFailure(needs), /échoué ou.*annulé/);
    }
  }
});

test('missing or unexpectedly skipped mandatory jobs block the merge', () => {
  for (const name of ['analyze-affected', 'validate-affected-projects']) {
    const needs = successfulNeeds();
    needs[name].result = 'skipped';
    assert.match(getCiFailure(needs), /obligatoire/);
    delete needs[name];
    assert.match(getCiFailure(needs), /obligatoire/);
  }
});

for (const [name, flag] of [
  ['storybook', 'run-ui-storybook'],
  ['storybook', 'run-app-storybook'],
  ['prepare-test-db', 'run-prepare-test-db'],
  ['test-db-deploy', 'run-db-deploy'],
  ['test-backend-api', 'run-backend-api'],
  ['test-end-to-end', 'run-e2e'],
]) {
  test(`affected ${flag} requires a successful ${name}`, () => {
    const needs = successfulNeeds();
    needs['analyze-affected'].outputs[flag] = 'true';
    assert.match(getCiFailure(needs), /attendu/);
    needs[name].result = 'success';
    assert.equal(getCiFailure(needs), null);
    delete needs['analyze-affected'].outputs[flag];
    assert.match(getCiFailure(needs), /scope/);
  });
}

test('workflow entrypoints publish the mode, a summary and a blocking exit code', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'native-stack-policy-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const eventPath = join(directory, 'event.json');
  const outputPath = join(directory, 'output');
  const summaryPath = join(directory, 'summary');
  writeFileSync(eventPath, JSON.stringify(stackedEvent()));
  const env = {
    ...process.env,
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_RUN_ATTEMPT: '1',
    GITHUB_OUTPUT: outputPath,
    GITHUB_STEP_SUMMARY: summaryPath,
  };
  const run = (script, extraEnv = {}) =>
    spawnSync(
      process.execPath,
      [fileURLToPath(new URL(script, import.meta.url))],
      { env: { ...env, ...extraEnv }, encoding: 'utf8' },
    );
  assert.equal(run('./select-ci-mode.mjs').status, 0);
  assert.equal(readFileSync(outputPath, 'utf8'), 'mode=deferred\n');
  assert.match(readFileSync(summaryPath, 'utf8'), /merge reste bloqué/);

  const needs = successfulNeeds();
  needs['analyze-affected'].outputs['ci-mode'] = 'deferred';
  assert.equal(
    run('./check-ci-status.mjs', { CI_NEEDS: JSON.stringify(needs) }).status,
    1,
  );
  needs['analyze-affected'].outputs['ci-mode'] = 'full';
  assert.equal(
    run('./check-ci-status.mjs', { CI_NEEDS: JSON.stringify(needs) }).status,
    0,
  );
});
