import { validateSelectSql } from './validate-select-sql.rules';

describe('validateSelectSql', () => {
  test('accepte un SELECT simple et retire le point-virgule final', () => {
    expect(validateSelectSql('  select 1 as n;  ')).toEqual({
      ok: true,
      sql: 'select 1 as n',
    });
  });

  test('accepte une CTE', () => {
    const sql = 'WITH c AS (SELECT 1 AS n) SELECT n FROM c';
    expect(validateSelectSql(sql)).toEqual({ ok: true, sql });
  });

  test('retire les barrières markdown', () => {
    expect(validateSelectSql('```sql\nselect 1\n```')).toEqual({
      ok: true,
      sql: 'select 1',
    });
  });

  test('refuse une requête vide', () => {
    expect(validateSelectSql('   ')).toMatchObject({ ok: false });
  });

  test('refuse plusieurs instructions', () => {
    expect(validateSelectSql('select 1; select 2')).toMatchObject({
      ok: false,
      reason: expect.stringContaining('Plusieurs instructions'),
    });
  });

  test('refuse ce qui ne commence pas par SELECT ou WITH', () => {
    expect(validateSelectSql('EXPLAIN select 1')).toMatchObject({
      ok: false,
      reason: expect.stringContaining('SELECT'),
    });
  });

  test.each([
    'UPDATE prod.collectivite SET nom = 1',
    'select 1 union all delete from x',
    'with x as (select 1) insert into y select * from x',
    'select pg_sleep(10)',
    "select pg_sleep_for('1 hour')",
    "select set_config('default_transaction_read_only', 'off', false)",
    "select set_config('statement_timeout', '0', false)",
    'select pg_advisory_lock(42)',
    'select pg_try_advisory_xact_lock(42)',
    'select pg_terminate_backend(1)',
    "select pg_read_file('/etc/passwd')",
    'select * from prod.collectivite; drop table prod.collectivite',
  ])('refuse les commandes de modification : %s', (sql) => {
    expect(validateSelectSql(sql)).toMatchObject({ ok: false });
  });

  test('ne confond pas un mot interdit avec un identifiant qui le contient', () => {
    const sql =
      'select deleted, created_at, updated_at from prod.public_fiche_action';
    expect(validateSelectSql(sql)).toEqual({ ok: true, sql });
  });

  test('refuse les tables catalogue', () => {
    expect(
      validateSelectSql('select * from information_schema.columns')
    ).toMatchObject({
      ok: false,
      reason: expect.stringContaining('describe_table'),
    });
  });
});
