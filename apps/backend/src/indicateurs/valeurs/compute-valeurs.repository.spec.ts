import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ComputeValeursRepository } from './compute-valeurs.repository';

describe('ComputeValeursRepository', () => {
  it('charge les dépendances de formule pour la même période et la même périodicité', async () => {
    const builder = {
      from: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn().mockResolvedValue([]),
    };
    builder.from.mockReturnValue(builder);
    builder.leftJoin.mockReturnValue(builder);
    const select = vi.fn(() => builder);
    const repository = new ComputeValeursRepository({
      db: {},
    } as DatabaseService);

    await repository.listSourceValeurs(
      [
        {
          collectiviteId: 42,
          identifiants: ['CAE_1.A'],
          sourceId: null,
          extraSourceCalculIds: [],
          period: IndicateurPeriods.parse('mensuelle', '2026-02'),
        },
      ],
      { select } as never
    );

    const condition = builder.where.mock.calls[0]?.[0] as SQL;
    const query = new PgDialect().sqlToQuery(condition);
    expect(query.sql).toContain('"collectivite_id" =');
    expect(query.sql).toContain('"date_valeur" =');
    expect(query.sql).toContain('"periodicite" =');
    expect(query.params).toEqual([42, '2026-02-01', 'mensuelle', 'CAE_1.A']);
  });
});

it('borne la source PCAET à la démarche mais conserve les sources complémentaires partagées', async () => {
  const builder = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn().mockResolvedValue([]),
  };
  builder.from.mockReturnValue(builder);
  builder.leftJoin.mockReturnValue(builder);
  const repository = new ComputeValeursRepository({
    db: {},
  } as DatabaseService);
  await repository.listSourceValeurs(
    [
      {
        collectiviteId: 42,
        identifiants: ['cae_1.a'],
        sourceId: 'pcaet-collectivite',
        metadonneeId: 15,
        extraSourceCalculIds: ['insee'],
        period: IndicateurPeriods.parse('annuelle', '2026'),
      },
    ],
    { select: vi.fn(() => builder) } as never
  );
  const query = new PgDialect().sqlToQuery(
    builder.where.mock.calls[0][0] as SQL
  );
  expect(query.sql).toContain('"metadonnee_id" =');
  expect(query.params).toEqual([
    42,
    '2026-01-01',
    'annuelle',
    'cae_1.a',
    'pcaet-collectivite',
    15,
    'insee',
  ]);
});
