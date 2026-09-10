import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ListCollectiviteDefinitionsRepository } from './list-collectivite-definitions.repository';

describe('ListCollectiviteDefinitionsRepository', () => {
  it('utilise la transaction fournie en conservant le périmètre de la collectivité', async () => {
    const where = vi.fn().mockResolvedValue([]);
    const leftJoin = vi.fn(() => ({ where }));
    const from = vi.fn(() => ({ leftJoin }));
    const select = vi.fn(() => ({ from }));
    const baseSelect = vi.fn();
    const repository = new ListCollectiviteDefinitionsRepository({
      db: { select: baseSelect },
    } as unknown as DatabaseService);
    const tx = { select } as unknown as Transaction;

    await repository.listCollectiviteDefinitions(
      {
        collectiviteId: 42,
        identifiantsReferentiel: ['CAE_1.A'],
        indicateurIds: [7],
      },
      tx
    );

    expect(select).toHaveBeenCalledOnce();
    expect(baseSelect).not.toHaveBeenCalled();
    const condition = where.mock.calls[0]?.[0] as SQL;
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"collectivite_id" =');
    expect(query.sql).toContain('"collectivite_id" is null');
    expect(query.sql).toContain('"groupement_id" is not null');
    expect(query.params).toEqual(['CAE_1.A', 7, 42]);
  });
});
