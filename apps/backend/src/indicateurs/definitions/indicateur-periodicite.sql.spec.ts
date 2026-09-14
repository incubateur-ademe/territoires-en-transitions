import { PgDialect } from 'drizzle-orm/pg-core';
import {
  indicateurCollectivitePeriodiciteSelection,
  indicateurDefinitionPeriodiciteSelection,
  indicateurValeurPeriodiciteSelection,
} from './indicateur-periodicite.sql';
import {
  createIndicateurDefinitionInputSchema,
  updateIndicateurDefinitionInputSchema,
} from './mutate-definition/mutate-definition.input';
import { listIndicateurValeursInputSchema } from '../valeurs/list-indicateur-valeurs.input';

describe('Annual storage preparation', () => {
  it('projects fixed annual/imposed metadata without reading future database columns', () => {
    const dialect = new PgDialect();
    for (const selection of [
      indicateurDefinitionPeriodiciteSelection,
      indicateurCollectivitePeriodiciteSelection,
      indicateurValeurPeriodiciteSelection,
    ]) {
      expect(dialect.sqlToQuery(selection.periodicite)).toMatchObject({
        sql: '$1',
        params: ['annuelle'],
      });
    }
    expect(
      dialect.sqlToQuery(
        indicateurDefinitionPeriodiciteSelection.periodiciteMode
      )
    ).toMatchObject({ sql: '$1', params: ['imposee'] });
    expect(
      dialect.sqlToQuery(
        indicateurCollectivitePeriodiciteSelection.periodicitePersonnalisee
      )
    ).toMatchObject({ sql: 'null', params: [] });
  });

  it('rejects monthly creation and customization until database activation', () => {
    expect(
      createIndicateurDefinitionInputSchema.safeParse({
        collectiviteId: 1,
        titre: 'Test',
        periodicite: 'mensuelle',
      }).success
    ).toBe(false);
    expect(
      updateIndicateurDefinitionInputSchema.safeParse({
        collectiviteId: 1,
        indicateurId: 2,
        indicateurFields: { periodicite: 'mensuelle' },
      }).success
    ).toBe(false);
    expect(
      listIndicateurValeursInputSchema.safeParse({
        collectiviteId: 1,
        indicateurIds: [2],
        periodicite: 'mensuelle',
      }).success
    ).toBe(false);
  });
});
