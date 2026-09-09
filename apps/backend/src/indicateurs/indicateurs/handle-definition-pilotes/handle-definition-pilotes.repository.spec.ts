import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PgDialect } from 'drizzle-orm/pg-core';
import { HandleDefinitionPilotesRepository } from './handle-definition-pilotes.repository';

describe('HandleDefinitionPilotesRepository', () => {
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
