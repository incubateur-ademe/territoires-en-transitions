import { PgDialect } from 'drizzle-orm/pg-core';
import { matchesActionOrDescendant } from './action-or-descendant.utils';
import { actionRelationTable } from './models/action-relation.table';

describe('matchesActionOrDescendant', () => {
  test("compare l'action exacte et un motif LIKE échappé, ancré sur le point", () => {
    const query = new PgDialect().sqlToQuery(
      matchesActionOrDescendant(actionRelationTable.id, 'cae_1.1')
    );

    expect(query).toEqual({
      sql: '("action_relation"."id" = $1 or "action_relation"."id" like $2)',
      params: ['cae_1.1', 'cae\\_1.1.%'],
      typings: expect.anything(),
    });
  });
});
