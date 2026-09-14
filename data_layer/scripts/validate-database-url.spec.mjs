import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scriptPath = fileURLToPath(
  new URL('./validate-database-url.mjs', import.meta.url)
);

function validate(policy, databaseUrl, expectedProjectRef) {
  return spawnSync(process.execPath, [scriptPath, policy], {
    encoding: 'utf8',
    env: {
      DATABASE_URL: databaseUrl,
      EXPECTED_SUPABASE_PROJECT_REF: expectedProjectRef ?? '',
    },
  });
}

test('accepts loopback URLs for a local bootstrap', () => {
  assert.equal(
    validate(
      'local-bootstrap',
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    ).status,
    0
  );
});

test('rejects remote and query-overridden local bootstrap targets', () => {
  assert.notEqual(
    validate(
      'local-bootstrap',
      'postgresql://postgres:secret@db.example.com:5432/postgres'
    ).status,
    0
  );
  assert.notEqual(
    validate(
      'local-bootstrap',
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres?host=db.example.com'
    ).status,
    0
  );
});

test('accepts only explicitly disposable loopback databases for destructive tests', () => {
  assert.equal(
    validate(
      'local-disposable',
      'postgresql://postgres:postgres@127.0.0.1:54322/periodicite_contract_test_20260904'
    ).status,
    0
  );
  assert.equal(
    validate(
      'local-disposable',
      'postgresql://postgres:postgres@localhost:5432/tmp'
    ).status,
    0
  );

  for (const databaseUrl of [
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    'postgresql://postgres:postgres@127.0.0.1:54322/contest',
    'postgresql://postgres:secret@db.example.com:5432/migration_test',
  ]) {
    assert.notEqual(validate('local-disposable', databaseUrl).status, 0);
  }
});

test('accepts only the exact internal Supabase database for destructive CI tests', () => {
  assert.equal(
    validate(
      'local-supabase-ci',
      'postgresql://postgres:postgres@supabase_db_tet:5432/postgres'
    ).status,
    0
  );

  for (const databaseUrl of [
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    'postgresql://postgres:postgres@supabase_db_tet/postgres',
    'postgresql://postgres:postgres@supabase_db_tet:5432/production',
    'postgresql://admin:postgres@supabase_db_tet:5432/postgres',
    'postgresql://postgres:secret@supabase_db_tet:5432/postgres',
    'postgresql://postgres:postgres@supabase_db_tet:5432/postgres?sslmode=disable',
    'postgresql://postgres:postgres@database.example:5432/postgres',
  ]) {
    assert.notEqual(validate('local-supabase-ci', databaseUrl).status, 0);
  }
});

test('accepts direct and session-pooler URLs for the expected Supabase project', () => {
  assert.equal(
    validate(
      'supabase-contract',
      'postgresql://postgres:secret@db.project-ref.supabase.co:5432/postgres?sslmode=verify-full',
      'project-ref'
    ).status,
    0
  );
  assert.equal(
    validate(
      'supabase-contract',
      'postgresql://postgres.project-ref:secret@aws-0-eu-west-3.pooler.supabase.com:5432/postgres',
      'project-ref'
    ).status,
    0
  );
});

test('rejects wrong projects, transaction poolers and insecure TLS', () => {
  assert.notEqual(
    validate(
      'supabase-contract',
      'postgresql://postgres:secret@db.other-project.supabase.co:5432/postgres',
      'project-ref'
    ).status,
    0
  );
  assert.notEqual(
    validate(
      'supabase-contract',
      'postgresql://postgres.project-ref:secret@aws-0-eu-west-3.pooler.supabase.com:6543/postgres',
      'project-ref'
    ).status,
    0
  );
  assert.notEqual(
    validate(
      'supabase-contract',
      'postgresql://postgres:secret@db.project-ref.supabase.co:5432/postgres?sslmode=disable',
      'project-ref'
    ).status,
    0
  );
});

test('rejects libpq identity overrides and duplicate connection parameters', () => {
  assert.notEqual(
    validate(
      'supabase-contract',
      'postgresql://postgres:secret@db.project-ref.supabase.co:5432/postgres?host=db.other-project.supabase.co',
      'project-ref'
    ).status,
    0
  );
  assert.notEqual(
    validate(
      'supabase-contract',
      'postgresql://postgres:secret@db.project-ref.supabase.co:5432/postgres?sslmode=require&sslmode=disable',
      'project-ref'
    ).status,
    0
  );
});

test('accepts only exact local, staging and preprod restore targets', () => {
  assert.equal(
    validate(
      'restore-target',
      'postgresql://postgres:postgres@host.docker.internal:54322/postgres'
    ).status,
    0
  );
  assert.equal(
    validate(
      'restore-target',
      'postgresql://postgres:secret@db.qwbsrgwlypaqheoedxxq.supabase.co:5432/postgres?sslmode=require'
    ).status,
    0
  );
  assert.equal(
    validate(
      'restore-target',
      'postgresql://postgres.xbrefnclajfcjlpnwyow:secret@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=require'
    ).status,
    0
  );
});

test('rejects restore allowlist values outside the parsed target identity', () => {
  assert.notEqual(
    validate(
      'restore-target',
      'postgresql://localhost:secret@db.example.com:5432/postgres'
    ).status,
    0
  );
  assert.notEqual(
    validate(
      'restore-target',
      'postgresql://postgres:qwbsrgwlypaqheoedxxq@db.example.com:5432/postgres'
    ).status,
    0
  );
  assert.notEqual(
    validate(
      'restore-target',
      'postgresql://postgres:secret@db.qwbsrgwlypaqheoedxxq.supabase.co.attacker.example:5432/postgres'
    ).status,
    0
  );
  assert.notEqual(
    validate(
      'restore-target',
      'postgresql://postgres:secret@db.qwbsrgwlypaqheoedxxq.supabase.co:5432/postgres'
    ).status,
    0
  );
});
