import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ListPlatformDefinitionsRepository } from './list-platform-definitions.repository';

const makeRepository = () => {
  const where = vi.fn().mockResolvedValue([]);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const baseSelect = vi.fn();
  const repository = new ListPlatformDefinitionsRepository({
    db: { select: baseSelect },
  } as unknown as DatabaseService);

  return {
    repository,
    tx: { select } as unknown as Transaction,
    select,
    where,
    baseSelect,
  };
};

describe('ListPlatformDefinitionsRepository', () => {
  it('utilise la transaction fournie et borne les définitions à la plateforme', async () => {
    const { repository, tx, select, where, baseSelect } = makeRepository();

    await repository.listPlatformDefinitions(
      { identifiantsReferentiel: ['CAE_1.A'], indicateurIds: [7] },
      tx
    );

    expect(select).toHaveBeenCalledOnce();
    expect(baseSelect).not.toHaveBeenCalled();
    const condition = where.mock.calls[0]?.[0] as SQL;
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"identifiant_referentiel" is not null');
    expect(query.sql).toContain('"collectivite_id" is null');
    expect(query.params).toEqual(['CAE_1.A', 7]);
  });
});
