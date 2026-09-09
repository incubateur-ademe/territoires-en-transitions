import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { MutateDefinitionRepository } from './mutate-definition.repository';

describe('MutateDefinitionRepository', () => {
  it('borne la suppression à la définition personnalisée de la collectivité', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 7 }]);
    const where = vi.fn((_condition: SQL) => ({ returning }));
    const deleteDefinition = vi.fn(() => ({ where }));
    const repository = new MutateDefinitionRepository({
      db: {},
    } as DatabaseService);

    await expect(
      repository.deletePersonalizedDefinition(
        { indicateurId: 7, collectiviteId: 42 },
        { delete: deleteDefinition } as never
      )
    ).resolves.toBe(true);

    const condition = where.mock.calls[0]?.[0] as SQL;
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"id" =');
    expect(query.sql).toContain('"collectivite_id" =');
    expect(query.sql).toContain('"collectivite_id" is not null');
    expect(query.params).toEqual([7, 42]);
  });

  it("verrouille et retourne le propriétaire stocké de la définition avant l'écriture", async () => {
    const forUpdate = vi
      .fn()
      .mockResolvedValue([{ collectiviteId: 42, periodicite: 'annuelle' }]);
    const limit = vi.fn(() => ({ for: forUpdate }));
    const where = vi.fn((_condition: SQL) => ({ limit }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    const repository = new MutateDefinitionRepository({
      db: {},
    } as DatabaseService);

    await expect(
      repository.lockDefinitionOwnership(7, { select } as never)
    ).resolves.toEqual({ collectiviteId: 42, periodicite: 'annuelle' });

    expect(forUpdate).toHaveBeenCalledWith('update');
    const condition = where.mock.calls[0]?.[0] as SQL;
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"id" =');
    expect(query.params).toEqual([7]);
  });
});
