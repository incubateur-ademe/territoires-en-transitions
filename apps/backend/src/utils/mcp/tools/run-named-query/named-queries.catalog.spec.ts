import { validateSelectSql } from '../run-sql-query/validate-select-sql.rules';
import { NAMED_QUERIES } from './named-queries.catalog';

describe('NAMED_QUERIES', () => {
  test('les noms sont uniques et en snake_case', () => {
    const names = NAMED_QUERIES.map((query) => query.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  test.each(NAMED_QUERIES.map((query) => [query.name, query]))(
    '%s passe la validation SQL et déclare tous ses paramètres',
    (_, query) => {
      expect(validateSelectSql(query.sql)).toMatchObject({ ok: true });

      const placeholders = new Set(
        [...query.sql.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]))
      );
      expect([...placeholders].sort()).toEqual(
        query.params.map((_, index) => index + 1)
      );
      expect(query.maxRows).toBeGreaterThan(0);
      expect(query.description).toContain('Source :');
    }
  );
});
