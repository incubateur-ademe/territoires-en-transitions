import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { PgDialect } from 'drizzle-orm/pg-core';
import { HandleDefinitionPilotesRepository } from './handle-definition-pilotes.repository';

describe('HandleDefinitionPilotesRepository', () => {
  it('reads retained user assignments in the same indicator, collectivité and transaction', async () => {
    const userId = crypto.randomUUID();
    const where = vi.fn().mockResolvedValue([{ userId }]);
    const tx = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
    };
    const database = { select: vi.fn() };
    const repository = new HandleDefinitionPilotesRepository({
      db: database,
    } as unknown as DatabaseService);

    await expect(
      repository.listIndicateurPiloteUserIds(
        { indicateurId: 1, collectiviteId: 2 },
        tx as unknown as Transaction
      )
    ).resolves.toEqual([userId]);

    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"indicateur_id" = $1');
    expect(query.sql).toContain('"collectivite_id" = $2');
    expect(query.sql).toContain('"user_id" is not null');
    expect(query.params).toEqual([1, 2]);
    expect(database.select).not.toHaveBeenCalled();
  });

  it('writes through the selected database without opening a transaction', async () => {
    const database = {
      transaction: vi.fn(),
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    };
    const repository = new HandleDefinitionPilotesRepository({
      db: database,
    } as unknown as DatabaseService);

    await repository.upsertIndicateurPilotes({
      indicateurId: 1,
      collectiviteId: 2,
      pilotes: [],
    });

    expect(database.delete).toHaveBeenCalledOnce();
    expect(database.transaction).not.toHaveBeenCalled();
  });

  it('removes stale tag and user pilotes independently despite nullable columns', async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const database = {
      delete: vi.fn(() => ({ where })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({ onConflictDoNothing })),
      })),
    };
    const repository = new HandleDefinitionPilotesRepository({
      db: database,
    } as unknown as DatabaseService);

    await repository.upsertIndicateurPilotes({
      indicateurId: 1,
      collectiviteId: 2,
      pilotes: [{ tagId: 10 }, { userId: crypto.randomUUID() }],
    });

    const deletionCondition = where.mock.calls[0][0];
    const query = new PgDialect().sqlToQuery(deletionCondition);
    expect(query.sql).toContain('"tag_id" is not null');
    expect(query.sql).toContain('"tag_id" not in');
    expect(query.sql).toContain('"user_id" is not null');
    expect(query.sql).toContain('"user_id" not in');
    expect(query.sql).toContain(' or ');
  });
});
