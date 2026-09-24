import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { CrudValeursRepository } from './crud-valeurs.repository';

describe('CrudValeursRepository', () => {
  it('borne la lecture modifiable à la valeur utilisateur et à ses deux parents', async () => {
    const storedValeur = { id: 9 };
    const limit = vi.fn().mockResolvedValue([storedValeur]);
    const where = vi.fn((_condition: SQL) => ({ limit }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    const repository = new CrudValeursRepository({
      db: {},
    } as DatabaseService);

    await expect(
      repository.findUserValeur(
        { collectiviteId: 42, indicateurId: 7, id: 9 },
        { select } as never
      )
    ).resolves.toBe(storedValeur);

    const condition = where.mock.calls[0]?.[0] as SQL;
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"collectivite_id" =');
    expect(query.sql).toContain('"indicateur_id" =');
    expect(query.sql).toContain('"id" =');
    expect(query.sql).toContain('"metadonnee_id" is null');
    expect(query.params).toEqual([42, 7, 9]);
  });

  it("verrouille uniquement les appartenances de groupement demandées dans la transaction d'écriture", async () => {
    const lock = vi.fn().mockResolvedValue([
      { groupementId: 11, collectiviteId: 42 },
      { groupementId: 11, collectiviteId: 43 },
    ]);
    const orderBy = vi.fn(() => ({ for: lock }));
    const where = vi.fn((_condition: SQL) => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    const baseSelect = vi.fn();
    const repository = new CrudValeursRepository({
      db: { select: baseSelect },
    } as unknown as DatabaseService);

    await expect(
      repository.lockGroupementMemberships(
        [
          { groupementId: 12, collectiviteId: 44 },
          { groupementId: 11, collectiviteId: 43 },
          { groupementId: 11, collectiviteId: 42 },
          { groupementId: 11, collectiviteId: 43 },
        ],
        { select } as never
      )
    ).resolves.toEqual([
      { groupementId: 11, collectiviteId: 42 },
      { groupementId: 11, collectiviteId: 43 },
    ]);

    expect(baseSelect).not.toHaveBeenCalled();
    expect(orderBy).toHaveBeenCalledOnce();
    expect(lock).toHaveBeenCalledWith('share');
    const condition = where.mock.calls[0]?.[0] as SQL;
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"groupement_id" =');
    expect(query.sql).toContain('"collectivite_id" in');
    expect(query.params).toEqual([11, 42, 43, 12, 44]);
  });

  it("ne lance aucune requête quand aucune appartenance n'est à vérifier", async () => {
    const select = vi.fn();
    const repository = new CrudValeursRepository({
      db: {},
    } as DatabaseService);

    await expect(
      repository.lockGroupementMemberships([], { select } as never)
    ).resolves.toEqual([]);

    expect(select).not.toHaveBeenCalled();
  });
});

it('préserve le filtre de métadonnée isolant le diagnostic PCAET', async () => {
  const builder = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn().mockResolvedValue([]),
  };
  builder.from.mockReturnValue(builder);
  builder.leftJoin.mockReturnValue(builder);
  const repository = new CrudValeursRepository({ db: {} } as DatabaseService);
  await repository.listIndicateurValeurs(
    { collectiviteId: 42, metadonneeId: 15 },
    { select: vi.fn(() => builder) } as never
  );
  const query = new PgDialect().sqlToQuery(
    builder.where.mock.calls[0][0] as SQL
  );
  expect(query.sql).toContain('"metadonnee_id" =');
  expect(query.params).toEqual([42, 15]);
});
