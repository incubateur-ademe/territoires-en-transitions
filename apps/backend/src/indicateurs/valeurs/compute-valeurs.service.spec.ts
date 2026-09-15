import {
  IndicateurDefinition,
  IndicateurPeriodicite,
  IndicateurPeriods,
  IndicateurValeur,
} from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import ComputeValeursService from './compute-valeurs.service';
import IndicateurExpressionService from './indicateur-expression.service';
import { LoadIndicateurCalculGraphService } from './load-indicateur-calcul-graph.service';
const createService = (
  repository: never,
  definitions: never,
  sources: never,
  expressions: IndicateurExpressionService,
  locks: never,
  valeurLocks: never
) =>
  new ComputeValeursService(
    repository,
    new LoadIndicateurCalculGraphService(definitions, locks, expressions),
    sources,
    expressions,
    valeurLocks
  );

const createComputeValeursRepository = (
  overrides: Record<string, unknown> = {}
) => ({
  listSourceCalculs: vi.fn().mockResolvedValue([]),
  listSourceValeurs: vi.fn().mockResolvedValue([]),
  listStoredCalculatedValeurs: vi.fn().mockResolvedValue([]),
  listPeriodKeys: vi.fn().mockResolvedValue([]),
  listRelevantValeurs: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const definition = (
  id: number,
  identifiantReferentiel: string,
  valeurCalcule: string | null = null,
  periodicite: IndicateurPeriodicite = 'mensuelle'
) =>
  ({
    id,
    identifiantReferentiel,
    valeurCalcule,
    periodicite,
    periodiciteMode: 'recommandee',
    collectiviteId: null,
    precision: 2,
  } as IndicateurDefinition);

const valeur = (indicateurId: number, resultat: number | null) =>
  ({
    id: indicateurId,
    indicateurId,
    collectiviteId: 1,
    periodicite: 'mensuelle',
    dateValeur: '2026-02-01',
    resultat,
    objectif: null,
    metadonneeId: null,
  } as IndicateurValeur);

describe('ComputeValeursService', () => {
  it.each([10, 0, null])(
    'conserve le calcul après suppression d’une source optionnelle (résultat restant : %s)',
    async (resultat) => {
      const sourceA = definition(1, 'source_a');
      const sourceB = definition(2, 'source_b');
      const target = definition(
        3,
        'target',
        'opt_val(source_a) + val(source_b)'
      );
      const storedCalculatedValeur = {
        ...valeur(target.id, 15),
        id: 30,
        calculAuto: true,
        periodicite: 'mensuelle' as const,
        sourceId: null,
      };
      const repository = createComputeValeursRepository({
        // The SQL left join returns null for a surviving collectivité source;
        // the deleted input row has no sourceId property at all.
        listSourceValeurs: vi.fn().mockResolvedValue([
          {
            ...valeur(sourceB.id, resultat),
            objectif: 20,
            indicateurIdentifiant: 'source_b',
            sourceId: null,
            metadonneeDateVersion: null,
            deleted: false,
            period: IndicateurPeriods.parse('mensuelle', '2026-02'),
          },
        ]),
        listStoredCalculatedValeurs: vi
          .fn()
          .mockResolvedValue([storedCalculatedValeur]),
      });
      const service = createService(
        repository as never,
        {
          listPlatformDefinitions: vi
            .fn()
            .mockResolvedValueOnce([sourceA])
            .mockResolvedValueOnce([sourceB]),
          listPlatformDefinitionsHavingComputedValue: vi
            .fn()
            .mockResolvedValue([target]),
        } as never,
        {
          getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([]),
        } as never,
        new IndicateurExpressionService(),
        {
          lockForValueWrite: vi.fn(),
          lockDefinitions: vi
            .fn()
            .mockResolvedValue([sourceA, sourceB, target]),
        } as never,
        {} as never
      );
      vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

      const result = await service.reconcileDeletedIndicateurValeurs(
        [valeur(sourceA.id, 5)],
        {} as never
      );

      expect(result.valeurIdsToDelete).toEqual([]);
      expect(result.valeursToUpsert).toEqual([
        expect.objectContaining({
          indicateurId: target.id,
          resultat,
          objectif: 20,
          metadonneeId: null,
          calculAuto: true,
          calculAutoIdentifiantsManquants: ['source_a'],
        }),
      ]);
    }
  );

  it('remet le calcul à null lorsqu une source obligatoire devient nulle', async () => {
    const sourceA = definition(1, 'source_a');
    const sourceB = definition(2, 'source_b');
    const target = definition(3, 'target', 'val(source_a) + val(source_b)');
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi.fn().mockResolvedValue([sourceA, sourceB]),
      listPlatformDefinitionsHavingComputedValue: vi
        .fn()
        .mockResolvedValue([target]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([sourceA, sourceB, target]),
    };
    const sourceService = {
      getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([]),
    };
    const service = createService(
      createComputeValeursRepository() as never,
      listPlatformDefinitionsRepository as never,
      sourceService as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      {} as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);
    const tx = {} as never;

    const result = await service.updateCalculatedIndicateurValeurs(
      [valeur(1, null), valeur(2, 5)],
      tx
    );

    expect(result).toEqual([
      expect.objectContaining({
        indicateurId: 3,
        collectiviteId: 1,
        dateValeur: '2026-02-01',
        resultat: null,
        calculAuto: true,
      }),
    ]);
    expect(
      listPlatformDefinitionsRepository.listPlatformDefinitionsHavingComputedValue
    ).toHaveBeenCalledWith(
      { identifiantsReferentiel: ['source_a', 'source_b'] },
      tx
    );
    expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
      [sourceA.id, sourceB.id, target.id],
      tx
    );
    expect(
      definitionLockRepository.lockForValueWrite.mock.invocationCallOrder[0]
    ).toBeLessThan(
      listPlatformDefinitionsRepository
        .listPlatformDefinitionsHavingComputedValue.mock.invocationCallOrder[0]
    );
    expect(
      sourceService.getAllIndicateurSourceMetadonnees
    ).toHaveBeenCalledWith(tx);
  });

  it('ne produit aucune ligne quand une source obligatoire est absente', async () => {
    const sourceA = definition(1, 'source_a');
    const sourceB = definition(2, 'source_b');
    const target = definition(3, 'target', 'val(source_a) + val(source_b)');
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi
        .fn()
        .mockResolvedValueOnce([sourceA])
        .mockResolvedValueOnce([sourceB]),
      listPlatformDefinitionsHavingComputedValue: vi
        .fn()
        .mockResolvedValue([target]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([sourceA, sourceB, target]),
    };
    const sourceService = {
      getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([]),
    };
    const tx = {
      select: vi.fn(() => ({
        from: () => ({
          leftJoin: () => ({
            leftJoin: () => ({ where: vi.fn().mockResolvedValue([]) }),
          }),
        }),
      })),
    };
    const service = createService(
      createComputeValeursRepository() as never,
      listPlatformDefinitionsRepository as never,
      sourceService as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      {} as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

    await expect(
      service.updateCalculatedIndicateurValeurs(
        [valeur(sourceA.id, 5)],
        tx as never
      )
    ).resolves.toEqual([]);
  });

  it('traite une suppression comme une absence et réconcilie la ligne automatique', async () => {
    const source = definition(1, 'source_a');
    const target = definition(3, 'target', 'val(source_a)');
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi.fn().mockResolvedValue([source]),
      listPlatformDefinitionsHavingComputedValue: vi
        .fn()
        .mockResolvedValue([target]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([source, target]),
    };
    const sourceService = {
      getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([]),
    };
    const storedCalculatedValeur = {
      ...valeur(target.id, 5),
      id: 30,
      calculAuto: true,
      periodicite: 'mensuelle' as const,
      sourceId: null,
    };
    const repository = createComputeValeursRepository({
      // No surviving source row exists after the deletion.
      listSourceValeurs: vi.fn().mockResolvedValue([]),
      // The former automatic output is now stale.
      listStoredCalculatedValeurs: vi
        .fn()
        .mockResolvedValue([storedCalculatedValeur]),
    });
    const tx = {};
    const service = createService(
      repository as never,
      listPlatformDefinitionsRepository as never,
      sourceService as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      {} as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

    await expect(
      service.reconcileDeletedIndicateurValeurs(
        // Its former payload must not be interpreted as a present value.
        [valeur(source.id, 5)],
        tx as never
      )
    ).resolves.toEqual({
      valeursToUpsert: [],
      valeurIdsToDelete: [storedCalculatedValeur.id],
    });
  });

  it('utilise aussi la version de métadonnées la plus récente en calcul incrémental', async () => {
    const source = definition(1, 'source_a');
    const target = definition(3, 'target', 'val(source_a)');
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi.fn().mockResolvedValue([source]),
      listPlatformDefinitionsHavingComputedValue: vi
        .fn()
        .mockResolvedValue([target]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([source, target]),
    };
    const sourceService = {
      getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([
        {
          id: 10,
          sourceId: 'insee',
          dateVersion: '2025-01-01 00:00:00',
        },
        {
          id: 20,
          sourceId: 'insee',
          dateVersion: '2026-01-01 00:00:00',
        },
      ]),
    };
    const service = createService(
      createComputeValeursRepository() as never,
      listPlatformDefinitionsRepository as never,
      sourceService as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      {} as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

    await expect(
      service.updateCalculatedIndicateurValeurs(
        [
          { ...valeur(source.id, 1), id: 101, metadonneeId: 10 },
          { ...valeur(source.id, 2), id: 102, metadonneeId: 20 },
        ],
        {} as never
      )
    ).resolves.toEqual([
      expect.objectContaining({
        indicateurId: target.id,
        metadonneeId: 20,
        resultat: 2,
      }),
    ]);
  });

  it.each([
    { latestResultat: 20, expectedResultat: 50 },
    { latestResultat: null, expectedResultat: null },
  ])(
    'relit la version récente quand seule une ancienne observation est modifiée ($latestResultat)',
    async ({ latestResultat, expectedResultat }) => {
      const sourceA = definition(1, 'source_a');
      const sourceB = definition(2, 'source_b');
      const target = definition(3, 'target', 'val(source_a) + val(source_b)');
      const updatedOldValeur = {
        ...valeur(sourceA.id, 1),
        id: 101,
        metadonneeId: 10,
      };
      const storedSources = [
        {
          ...valeur(sourceA.id, latestResultat),
          id: 102,
          indicateurIdentifiant: 'source_a',
        },
        {
          ...valeur(sourceB.id, 30),
          id: 103,
          indicateurIdentifiant: 'source_b',
        },
      ].map((stored) => ({
        ...stored,
        metadonneeId: 20,
        sourceId: 'rare',
        metadonneeDateVersion: '2026-01-01',
        deleted: false,
        period: IndicateurPeriods.parse('mensuelle', '2026-02'),
      }));
      const repository = createComputeValeursRepository({
        // Match the repository filter: returning a newer A requires explicitly
        // querying A, even though the updated batch already contains that id.
        listSourceValeurs: vi.fn(
          async (queries: { identifiants: string[] }[]) =>
            storedSources.filter((stored) =>
              queries.some((query) =>
                query.identifiants.includes(stored.indicateurIdentifiant)
              )
            )
        ),
      });
      const service = createService(
        repository as never,
        {
          listPlatformDefinitions: vi
            .fn()
            .mockResolvedValueOnce([sourceA])
            .mockResolvedValueOnce([sourceB]),
          listPlatformDefinitionsHavingComputedValue: vi
            .fn()
            .mockResolvedValue([target]),
        } as never,
        {
          getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([
            { id: 10, sourceId: 'rare', dateVersion: '2025-01-01' },
            { id: 20, sourceId: 'rare', dateVersion: '2026-01-01' },
          ]),
        } as never,
        new IndicateurExpressionService(),
        {
          lockForValueWrite: vi.fn(),
          lockDefinitions: vi
            .fn()
            .mockResolvedValue([sourceA, sourceB, target]),
        } as never,
        {} as never
      );
      const tx = {} as never;

      const result = await service.updateCalculatedIndicateurValeurs(
        [updatedOldValeur],
        tx
      );

      expect(result).toEqual([
        expect.objectContaining({
          indicateurId: target.id,
          resultat: expectedResultat,
          metadonneeId: 20,
          calculAuto: true,
        }),
      ]);
      expect(repository.listSourceValeurs).toHaveBeenCalledWith(
        [expect.objectContaining({ identifiants: ['source_a', 'source_b'] })],
        tx
      );
    }
  );

  it('refuse une agrégation implicite entre deux périodicités', async () => {
    const annualSource = definition(1, 'source_a', null, 'annuelle');
    const monthlyTarget = definition(3, 'target', 'val(source_a)', 'mensuelle');
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi.fn().mockResolvedValue([annualSource]),
      listPlatformDefinitionsHavingComputedValue: vi
        .fn()
        .mockResolvedValue([monthlyTarget]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([annualSource, monthlyTarget]),
    };
    const sourceService = {
      getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([]),
    };
    const service = createService(
      createComputeValeursRepository() as never,
      listPlatformDefinitionsRepository as never,
      sourceService as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      {} as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

    await expect(
      service.updateCalculatedIndicateurValeurs(
        [
          {
            ...valeur(1, 5),
            dateValeur: '2026-01-01',
          },
        ],
        {} as never
      )
    ).rejects.toThrow(/agrégation explicite.*source_a \(annuelle\)/);
  });

  it('revalide la périodicité verrouillée avant d interpréter une valeur de janvier', async () => {
    const monthlySource = definition(1, 'source_a', null, 'mensuelle');
    const discoveredMonthlyTarget = definition(
      3,
      'target',
      'val(source_a)',
      'mensuelle'
    );
    const lockedAnnualTarget = definition(
      3,
      'target',
      'val(source_a)',
      'annuelle'
    );
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi.fn().mockResolvedValue([monthlySource]),
      listPlatformDefinitionsHavingComputedValue: vi
        .fn()
        .mockResolvedValue([discoveredMonthlyTarget]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi
        .fn()
        .mockResolvedValue([monthlySource, lockedAnnualTarget]),
    };
    const sourceService = {
      getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([]),
    };
    const service = createService(
      createComputeValeursRepository() as never,
      listPlatformDefinitionsRepository as never,
      sourceService as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      {} as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);
    const tx = {} as never;

    await expect(
      service.updateCalculatedIndicateurValeurs(
        [
          {
            ...valeur(1, 5),
            dateValeur: '2026-01-01',
          },
        ],
        tx
      )
    ).rejects.toThrow(/agrégation explicite.*source_a \(mensuelle\)/);
    expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
      [monthlySource.id, discoveredMonthlyTarget.id],
      tx
    );
  });

  it('revalide aussi les dépendances de formule sous verrou', async () => {
    const sourceA = definition(1, 'source_a', null, 'mensuelle');
    const discoveredSourceB = definition(2, 'source_b', null, 'mensuelle');
    const lockedSourceB = definition(2, 'source_b', null, 'annuelle');
    const target = definition(
      3,
      'target',
      'val(source_a) + val(source_b)',
      'mensuelle'
    );
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitionsHavingComputedValue: vi
        .fn()
        .mockResolvedValue([target]),
      listPlatformDefinitions: vi
        .fn()
        .mockResolvedValueOnce([sourceA])
        .mockResolvedValueOnce([discoveredSourceB]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi
        .fn()
        .mockResolvedValue([sourceA, lockedSourceB, target]),
    };
    const sourceService = {
      getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue([]),
    };
    const service = createService(
      createComputeValeursRepository() as never,
      listPlatformDefinitionsRepository as never,
      sourceService as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      {} as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);
    const tx = {} as never;

    await expect(
      service.updateCalculatedIndicateurValeurs([valeur(sourceA.id, 5)], tx)
    ).rejects.toThrow(/agrégation explicite.*source_b \(annuelle\)/);
    expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
      [sourceA.id, target.id, discoveredSourceB.id],
      tx
    );
  });

  it('recalcule depuis les définitions et les valeurs relues sous les mêmes verrous', async () => {
    const events: string[] = [];
    const source = definition(1, 'source_a');
    const target = definition(3, 'target', 'val(source_a)');
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi.fn(
        async ({ indicateurIds }: { indicateurIds?: number[] }) => {
          if (indicateurIds) {
            events.push('discover-targets');
            return [target];
          }
          events.push('discover-sources');
          return [source];
        }
      ),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn(async () => {
        events.push('lock-graph');
      }),
      lockDefinitions: vi.fn(async () => {
        events.push('lock-definitions');
        return [source, target];
      }),
    };
    const valeurLockRepository = {
      lock: vi.fn(async () => {
        events.push('lock-periods');
      }),
    };
    const storedSourceValeur = {
      ...valeur(source.id, 5),
      indicateurIdentifiant: source.identifiantReferentiel,
      periodicite: source.periodicite,
      sourceId: null,
    };
    const staleCalculatedValeur = {
      ...valeur(target.id, 4),
      id: 99,
      dateValeur: '2025-01-01',
      calculAuto: true,
      indicateurIdentifiant: target.identifiantReferentiel,
      periodicite: target.periodicite,
      sourceId: null,
    };
    const tx = {};
    const repository = createComputeValeursRepository({
      listPeriodKeys: vi.fn(async () => {
        events.push('discover-periods');
        return [
          {
            collectiviteId: storedSourceValeur.collectiviteId,
            dateValeur: storedSourceValeur.dateValeur,
          },
          {
            collectiviteId: staleCalculatedValeur.collectiviteId,
            dateValeur: staleCalculatedValeur.dateValeur,
          },
        ];
      }),
      listRelevantValeurs: vi.fn(async () => {
        events.push('reread-values');
        return [storedSourceValeur, staleCalculatedValeur];
      }),
    });
    const service = createService(
      repository as never,
      listPlatformDefinitionsRepository as never,
      {} as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      valeurLockRepository as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockImplementation(async () => {
      events.push('read-source-priorities');
      return [];
    });

    await expect(
      service.recomputeCollectiviteCalculatedIndicateurValeurs(
        storedSourceValeur.collectiviteId,
        [target.id],
        tx as never
      )
    ).resolves.toEqual({
      valeursToUpsert: [
        expect.objectContaining({
          indicateurId: target.id,
          collectiviteId: storedSourceValeur.collectiviteId,
          dateValeur: storedSourceValeur.dateValeur,
          resultat: 5,
        }),
      ],
      valeurIdsToDelete: [staleCalculatedValeur.id],
      indicateurIdentifiants: ['target'],
    });

    expect(events).toEqual([
      'lock-graph',
      'discover-targets',
      'discover-sources',
      'lock-definitions',
      'discover-periods',
      'lock-periods',
      'reread-values',
      'read-source-priorities',
    ]);
    expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
      [target.id, source.id],
      tx
    );
    expect(valeurLockRepository.lock).toHaveBeenCalledWith(
      [
        {
          collectiviteId: storedSourceValeur.collectiviteId,
          dateValeur: storedSourceValeur.dateValeur,
        },
        {
          collectiviteId: staleCalculatedValeur.collectiviteId,
          dateValeur: staleCalculatedValeur.dateValeur,
        },
      ],
      tx
    );
  });

  it('conserve la version de métadonnées la plus récente et supprime les anciens calculs', async () => {
    const source = definition(1, 'source_a');
    const target = definition(3, 'target', 'val(source_a)');
    const oldMetadonnee = {
      id: 10,
      sourceId: 'insee',
      dateVersion: '2025-01-01 00:00:00',
    };
    const latestMetadonnee = {
      id: 20,
      sourceId: 'insee',
      dateVersion: '2026-01-01 00:00:00',
    };
    const sourceValeur = (
      id: number,
      resultat: number,
      metadonnee: typeof oldMetadonnee
    ) => ({
      ...valeur(source.id, resultat),
      id,
      metadonneeId: metadonnee.id,
      indicateurIdentifiant: source.identifiantReferentiel,
      periodicite: source.periodicite,
      sourceId: metadonnee.sourceId,
      metadonneeDateVersion: metadonnee.dateVersion,
    });
    const calculatedValeur = (
      id: number,
      metadonnee: typeof oldMetadonnee
    ) => ({
      ...valeur(target.id, -1),
      id,
      metadonneeId: metadonnee.id,
      calculAuto: true,
      indicateurIdentifiant: target.identifiantReferentiel,
      periodicite: target.periodicite,
      sourceId: metadonnee.sourceId,
      metadonneeDateVersion: metadonnee.dateVersion,
    });
    const oldSourceValeur = sourceValeur(101, 1, oldMetadonnee);
    const latestSourceValeur = sourceValeur(102, 2, latestMetadonnee);
    const oldCalculatedValeur = calculatedValeur(201, oldMetadonnee);
    const latestCalculatedValeur = calculatedValeur(202, latestMetadonnee);
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi
        .fn()
        .mockResolvedValueOnce([target])
        .mockResolvedValueOnce([source]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([source, target]),
    };
    const valeurLockRepository = {
      lock: vi.fn().mockResolvedValue(undefined),
    };
    const tx = {};
    const repository = createComputeValeursRepository({
      listPeriodKeys: vi.fn().mockResolvedValue([
        {
          collectiviteId: 1,
          dateValeur: oldSourceValeur.dateValeur,
        },
      ]),
      // Old first is intentional: row order must not decide which metadata
      // identity survives reconciliation.
      listRelevantValeurs: vi
        .fn()
        .mockResolvedValue([
          oldSourceValeur,
          latestSourceValeur,
          oldCalculatedValeur,
          latestCalculatedValeur,
        ]),
    });
    const service = createService(
      repository as never,
      listPlatformDefinitionsRepository as never,
      {} as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      valeurLockRepository as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

    await expect(
      service.recomputeCollectiviteCalculatedIndicateurValeurs(
        1,
        [target.id],
        tx as never
      )
    ).resolves.toEqual({
      valeursToUpsert: [
        expect.objectContaining({
          indicateurId: target.id,
          metadonneeId: latestMetadonnee.id,
          resultat: 2,
        }),
      ],
      valeurIdsToDelete: [oldCalculatedValeur.id],
      indicateurIdentifiants: ['target'],
    });
  });

  it('supprime un ancien calcul quand une source obligatoire est absente de la réconciliation', async () => {
    const sourceA = definition(1, 'source_a');
    const sourceB = definition(2, 'source_b');
    const target = definition(3, 'target', 'val(source_a) + val(source_b)');
    const storedSourceValeur = {
      ...valeur(sourceA.id, 5),
      id: 101,
      indicateurIdentifiant: sourceA.identifiantReferentiel,
      periodicite: sourceA.periodicite,
      sourceId: null,
      metadonneeDateVersion: null,
    };
    const staleCalculatedValeur = {
      ...valeur(target.id, null),
      id: 201,
      calculAuto: true,
      indicateurIdentifiant: target.identifiantReferentiel,
      periodicite: target.periodicite,
      sourceId: null,
      metadonneeDateVersion: null,
    };
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi
        .fn()
        .mockResolvedValueOnce([target])
        .mockResolvedValueOnce([sourceA, sourceB]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([sourceA, sourceB, target]),
    };
    const valeurLockRepository = {
      lock: vi.fn().mockResolvedValue(undefined),
    };
    const tx = {};
    const repository = createComputeValeursRepository({
      listPeriodKeys: vi.fn().mockResolvedValue([
        {
          collectiviteId: 1,
          dateValeur: storedSourceValeur.dateValeur,
        },
      ]),
      listRelevantValeurs: vi
        .fn()
        .mockResolvedValue([storedSourceValeur, staleCalculatedValeur]),
    });
    const service = createService(
      repository as never,
      listPlatformDefinitionsRepository as never,
      {} as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      valeurLockRepository as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

    await expect(
      service.recomputeCollectiviteCalculatedIndicateurValeurs(
        1,
        [target.id],
        tx as never
      )
    ).resolves.toEqual({
      valeursToUpsert: [],
      valeurIdsToDelete: [staleCalculatedValeur.id],
      indicateurIdentifiants: ['target'],
    });
  });

  it('ignore une période apparue après la découverte de ses clés de verrou', async () => {
    const source = definition(1, 'source_a');
    const target = definition(3, 'target', 'val(source_a)');
    const discoveredSourceValeur = {
      ...valeur(source.id, 5),
      id: 101,
      indicateurIdentifiant: source.identifiantReferentiel,
      periodicite: source.periodicite,
      sourceId: null,
      metadonneeDateVersion: null,
    };
    const concurrentSourceValeur = {
      ...discoveredSourceValeur,
      id: 102,
      dateValeur: '2026-03-01',
      resultat: 8,
    };
    const concurrentCalculatedValeur = {
      ...valeur(target.id, 8),
      id: 202,
      dateValeur: concurrentSourceValeur.dateValeur,
      calculAuto: true,
      indicateurIdentifiant: target.identifiantReferentiel,
      periodicite: target.periodicite,
      sourceId: null,
      metadonneeDateVersion: null,
    };
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi
        .fn()
        .mockResolvedValueOnce([target])
        .mockResolvedValueOnce([source]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([source, target]),
    };
    const valeurLockRepository = {
      lock: vi.fn().mockResolvedValue(undefined),
    };
    const tx = {};
    const repository = createComputeValeursRepository({
      listPeriodKeys: vi.fn().mockResolvedValue([
        {
          collectiviteId: 1,
          dateValeur: discoveredSourceValeur.dateValeur,
        },
      ]),
      // Simulates a row committed between discovery and reread. The service
      // defensively rejects it even if a repository/mock failed to honor the
      // requested date predicate.
      listRelevantValeurs: vi
        .fn()
        .mockResolvedValue([
          discoveredSourceValeur,
          concurrentSourceValeur,
          concurrentCalculatedValeur,
        ]),
    });
    const service = createService(
      repository as never,
      listPlatformDefinitionsRepository as never,
      {} as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      valeurLockRepository as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

    await expect(
      service.recomputeCollectiviteCalculatedIndicateurValeurs(
        1,
        [target.id],
        tx as never
      )
    ).resolves.toEqual({
      valeursToUpsert: [
        expect.objectContaining({
          dateValeur: discoveredSourceValeur.dateValeur,
          resultat: 5,
        }),
      ],
      valeurIdsToDelete: [],
      indicateurIdentifiants: ['target'],
    });
    expect(valeurLockRepository.lock).toHaveBeenCalledWith(
      [
        {
          collectiviteId: 1,
          dateValeur: discoveredSourceValeur.dateValeur,
        },
      ],
      tx
    );
  });

  it('supprime les anciens résultats auto quand une formule disparaît', async () => {
    const targetWithoutFormula = definition(3, 'target', null);
    const autoValeur = {
      ...valeur(targetWithoutFormula.id, 5),
      id: 98,
      calculAuto: true,
      indicateurIdentifiant: targetWithoutFormula.identifiantReferentiel,
      periodicite: targetWithoutFormula.periodicite,
      sourceId: null,
    };
    const manualValeur = {
      ...autoValeur,
      id: 99,
      calculAuto: false,
    };
    const listPlatformDefinitionsRepository = {
      listPlatformDefinitions: vi
        .fn()
        .mockResolvedValue([targetWithoutFormula]),
    };
    const definitionLockRepository = {
      lockForValueWrite: vi.fn().mockResolvedValue(undefined),
      lockDefinitions: vi.fn().mockResolvedValue([targetWithoutFormula]),
    };
    const valeurLockRepository = {
      lock: vi.fn().mockResolvedValue(undefined),
    };
    const tx = {};
    const repository = createComputeValeursRepository({
      listPeriodKeys: vi.fn().mockResolvedValue([
        {
          collectiviteId: autoValeur.collectiviteId,
          dateValeur: autoValeur.dateValeur,
        },
      ]),
      listRelevantValeurs: vi
        .fn()
        .mockResolvedValue([autoValeur, manualValeur]),
    });
    const service = createService(
      repository as never,
      listPlatformDefinitionsRepository as never,
      {} as never,
      new IndicateurExpressionService(),
      definitionLockRepository as never,
      valeurLockRepository as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([]);

    await expect(
      service.recomputeCollectiviteCalculatedIndicateurValeurs(
        autoValeur.collectiviteId,
        [targetWithoutFormula.id],
        tx as never
      )
    ).resolves.toEqual({
      valeursToUpsert: [],
      valeurIdsToDelete: [autoValeur.id],
      indicateurIdentifiants: ['target'],
    });
  });
});

describe('PCAET calculation isolation', () => {
  const source = definition(1, 'source_a');
  const extra = definition(2, 'source_b');
  const target = definition(3, 'target', 'val(source_a) + val(source_b)');
  const observation = (
    indicateurId: number,
    resultat: number,
    metadonneeId: number,
    sourceId: string
  ) => ({
    ...valeur(indicateurId, resultat),
    metadonneeId,
    indicateurIdentifiant: indicateurId === 1 ? 'source_a' : 'source_b',
    sourceId,
    metadonneeDateVersion: `2026-01-${metadonneeId
      .toString()
      .padStart(2, '0')}`,
    deleted: false,
    period: IndicateurPeriods.parse('mensuelle', '2026-02'),
    periodicite: 'mensuelle' as const,
  });
  const pcaet = (resultat: number, metadonneeId: number) =>
    observation(1, resultat, metadonneeId, 'pcaet-collectivite');
  const shared = observation(2, 2, 20, 'insee');
  const setup = (rows: ReturnType<typeof observation>[]) => {
    const repository = createComputeValeursRepository({
      listSourceValeurs: vi.fn().mockResolvedValue(rows),
      listRelevantValeurs: vi.fn().mockResolvedValue(rows),
      listPeriodKeys: vi
        .fn()
        .mockResolvedValue([{ collectiviteId: 1, dateValeur: '2026-02-01' }]),
    });
    const definitions = {
      listPlatformDefinitions: vi
        .fn()
        .mockResolvedValue([source, extra, target]),
      listPlatformDefinitionsHavingComputedValue: vi
        .fn()
        .mockResolvedValue([target]),
    };
    const service = createService(
      repository as never,
      definitions as never,
      {
        getAllIndicateurSourceMetadonnees: vi.fn().mockResolvedValue(
          [10, 11, 20].map((id) => ({
            id,
            sourceId: id === 20 ? 'insee' : 'pcaet-collectivite',
            dateVersion: `2026-01-${id}`,
          }))
        ),
      } as never,
      new IndicateurExpressionService(),
      {
        lockForValueWrite: vi.fn(),
        lockDefinitions: vi.fn().mockResolvedValue([source, extra, target]),
      } as never,
      { lock: vi.fn() } as never
    );
    vi.spyOn(service, 'getSourcesCalcul').mockResolvedValue([
      { sourceId: 'pcaet-collectivite', sourceCalculIds: ['insee'] },
    ]);
    return { service, repository };
  };

  it('recalcule les deux démarches sans mélanger leurs valeurs', async () => {
    const { service } = setup([shared, pcaet(10, 10), pcaet(100, 11)]);
    const result =
      await service.recomputeCollectiviteCalculatedIndicateurValeurs(
        1,
        [3],
        {} as never
      );
    expect(result.valeursToUpsert).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resultat: 12, metadonneeId: 10 }),
        expect.objectContaining({ resultat: 102, metadonneeId: 11 }),
      ])
    );
    expect(result.valeursToUpsert).toHaveLength(2);
  });

  it('une modification de démarche charge seulement sa métadonnée', async () => {
    const { service, repository } = setup([pcaet(10, 10), shared]);
    const result = await service.updateCalculatedIndicateurValeurs(
      [pcaet(10, 10)],
      {} as never
    );
    expect(repository.listSourceValeurs).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          sourceId: 'pcaet-collectivite',
          metadonneeId: 10,
        }),
      ],
      expect.anything()
    );
    expect(result).toEqual([
      expect.objectContaining({ resultat: 12, metadonneeId: 10 }),
    ]);
  });

  it('une source partagée recalcule chaque métadonnée PCAET', async () => {
    const { service } = setup([shared, pcaet(10, 10), pcaet(100, 11)]);
    const result = await service.updateCalculatedIndicateurValeurs(
      [shared],
      {} as never
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resultat: 12, metadonneeId: 10 }),
        expect.objectContaining({ resultat: 102, metadonneeId: 11 }),
      ])
    );
    expect(result).toHaveLength(2);
  });

  it('supprimer une source ne supprime pas le calcul d’une autre démarche', async () => {
    const { service, repository } = setup([shared]);
    repository.listStoredCalculatedValeurs.mockResolvedValue(
      [10, 11].map((metadonneeId) => ({
        ...pcaet(12, metadonneeId),
        indicateurId: 3,
        id: metadonneeId + 100,
        calculAuto: true,
      }))
    );
    const result = await service.reconcileDeletedIndicateurValeurs(
      [pcaet(10, 10)],
      {} as never
    );
    expect(result.valeurIdsToDelete).toEqual([110]);
    expect(result.valeursToUpsert).toEqual([]);
  });
});
