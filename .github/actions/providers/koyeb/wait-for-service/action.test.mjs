import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

// Execute the action's actual shell body with a fake provider and clock.
const action = readFileSync(new URL('./action.yml', import.meta.url), 'utf8');
const script = action.split('      run: |\n')[1].replace(/^        /gm, '');
const mocks = String.raw`
date() { cat "$MOCK_DIR/time"; }
sleep() { echo "$(($(date +%s) + $1))" > "$MOCK_DIR/time"; }
timeout() {
  local request_timeout
  request_timeout=$(echo "$2" | tr -d s)
  shift 2
  MOCK_REQUEST_TIMEOUT="$request_timeout" "$@"
}
curl() { echo '{"commit":"abcdef0"}'; }
koyeb() {
  local resource="$1" count=0
  if [[ "$resource" == services ]]; then
    if [[ "$3" == "$SERVICE" ]]; then resource=initial; else resource=service; fi
  fi
  if [[ -f "$MOCK_DIR/$resource" ]]; then read -r count < "$MOCK_DIR/$resource"; fi
  count=$((count + 1))
  echo "$count" > "$MOCK_DIR/$resource"
  echo "$(date +%s) $resource $count $MOCK_REQUEST_TIMEOUT" >> "$MOCK_DIR/calls"
  if [[ "$resource" == "$FAIL_RESOURCE" && "$count" -ge "$FAIL_AT" ]]; then
    if [[ "$FAIL_MODE" == timeout ]]; then
      sleep "$MOCK_REQUEST_TIMEOUT"
      return 124
    fi
    if [[ "$FAIL_MODE" == always || "$count" == "$FAIL_AT" ]]; then
      echo 'Temporary provider failure' >&2
      return 1
    fi
  fi
  case "$resource" in
    initial|service)
      printf '{"id":"service-id","latest_deployment_id":"%s","active_deployment_id":"deployment-id","status":"HEALTHY"}\n' "$LATEST_DEPLOYMENT" ;;
    deployments)
      printf '{"id":"deployment-id","service_id":"service-id","status":"%s","definition":{"docker":{"image":"%s"}}}\n' "$DEPLOYMENT_STATUS" "$IMAGE" ;;
    instances)
      echo '{"instances":[{"service_id":"service-id","status":"HEALTHY","regional_deployment_id":"region-id"}]}' ;;
    regional-deployments)
      echo '{"deployment_id":"deployment-id","service_id":"service-id"}' ;;
    *) echo "Unexpected provider command: $*" >&2; return 2 ;;
  esac
}
`;

function runAction(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'koyeb-readiness-'));
  writeFileSync(join(dir, 'time'), '100\n');
  writeFileSync(join(dir, 'calls'), '');
  try {
    const result = spawnSync('bash', ['-c', mocks + script], {
      encoding: 'utf8',
      timeout: 5000,
      env: {
        PATH: '/usr/bin:/bin',
        MOCK_DIR: dir,
        SERVICE: 'staging-backend/backend',
        DEPLOYMENT: 'deployment-id',
        IMAGE: `ghcr.io/example/backend@sha256:${'a'.repeat(64)}`,
        DEADLINE: '110',
        STABILITY: '4',
        VERSION_URL: 'https://example.test/version',
        EXPECTED_COMMIT: 'abcdef0',
        LATEST_DEPLOYMENT: 'deployment-id',
        DEPLOYMENT_STATUS: 'HEALTHY',
        FAIL_RESOURCE: '',
        FAIL_AT: '2',
        FAIL_MODE: 'once',
        ...overrides,
      },
    });
    assert.ifError(result.error);
    return {
      ...result,
      time: Number(readFileSync(join(dir, 'time'), 'utf8')),
      calls: readFileSync(join(dir, 'calls'), 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [time, resource, count, timeout] = line.split(' ');
          return { time: +time, resource, count: +count, timeout: +timeout };
        }),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('waits for a continuous healthy observation window', () => {
  const result = runAction();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.time, 104);
});

test('retries the initial lookup and discovers the deployment', () => {
  const result = runAction({
    FAIL_RESOURCE: 'initial',
    FAIL_AT: '1',
    DEPLOYMENT: '',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.time, 106);
  assert.equal(
    result.calls.filter((call) => call.resource === 'initial').length,
    2
  );
});

for (const resource of [
  'service',
  'deployments',
  'instances',
  'regional-deployments',
]) {
  test(`retries ${resource} failures and restarts the stability window`, () => {
    const result = runAction({ FAIL_RESOURCE: resource });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.time, 108);
    const failure = result.calls.findIndex(
      (call) => call.resource === resource && call.count === 2
    );
    assert.equal(result.calls[failure + 1].resource, 'service');
    assert.equal(result.calls[failure + 1].time, 104);
  });
}

for (const resource of [
  'initial',
  'service',
  'deployments',
  'instances',
  'regional-deployments',
]) {
  test(`stops retrying persistent ${resource} failures at the deadline`, () => {
    const result = runAction({
      FAIL_RESOURCE: resource,
      FAIL_AT: '1',
      FAIL_MODE: 'always',
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Readiness deadline exceeded/);
    assert.equal(result.time, 110);
    assert.ok(result.calls.every((call) => call.time < 110));
  });
}

test('caps stalled requests to the remaining deadline', () => {
  const result = runAction({
    FAIL_RESOURCE: 'deployments',
    FAIL_MODE: 'timeout',
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Readiness deadline exceeded/);
  assert.ok(
    result.calls.every(
      (call) => call.timeout > 0 && call.timeout <= 110 - call.time
    )
  );
  assert.equal(result.calls.at(-1).timeout, 8);
});

for (const status of ['ERROR', 'UNHEALTHY', 'CANCELED']) {
  test(`fails immediately when the deployment is ${status}`, () => {
    const result = runAction({ DEPLOYMENT_STATUS: status });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /deployment deployment-id failed/);
    assert.equal(result.time, 100);
  });
}

test('fails immediately when another deployment supersedes the expected one', () => {
  const result = runAction({ LATEST_DEPLOYMENT: 'another-deployment' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /different deployment superseded/);
  assert.equal(result.time, 100);
});
