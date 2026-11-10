import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import {
  ELECTRIFICATION_SOURCE_ID,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from 'vitest';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '../../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../../shared/models/indicateur-source.table';
import { indicateurValeurTable } from '../indicateur-valeur.table';
import ComputeValeursService from '../compute-indicateur-valeurs/compute-valeurs.service';
import { ReconcileIndicateurValeursService } from '../reconcile-indicateur-valeurs/reconcile-indicateur-valeurs.service';

describe('Complétion des valeurs sans écrasement', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let service: ReconcileIndicateurValeursService;
  let createdSource: boolean;
  const llm = new FakeLlmRepository();

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(LlmService).useValue(new LlmService(llm));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    database = await getTestDatabase(app);
    service = app.get(ReconcileIndicateurValeursService);
    vi.spyOn(llm, 'complete');
    vi.spyOn(llm, 'chat');
    const inserted = await database.db
      .insert(indicateurSourceTable)
      .values({ id: ELECTRIFICATION_SOURCE_ID, libelle: 'Électrification' })
      .onConflictDoNothing()
      .returning();
    createdSource = inserted.length > 0;
  });

  afterAll(async () => {
    expect(llm.complete).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    if (createdSource) {
      await database.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, ELECTRIFICATION_SOURCE_ID));
    }
    await app?.close();
  });

  async function fixture(
    fields: Partial<typeof indicateurDefinitionTable.$inferInsert> = {},
    role: CollectiviteRole = CollectiviteRole.EDITION
  ) {
    const {
      collectivite,
      user: credentials,
      cleanup,
    } = await addTestCollectiviteAndUser(database, { user: { role } });
    const user = getAuthUserFromUserCredentials(credentials);
    const [indicateur] = await database.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel: `completion_${randomUUID().replaceAll(
          '-',
          ''
        )}`,
        titre: 'Indicateur à compléter',
        unite: 'MWh',
        periodicite: 'annuelle',
        precision: 2,
        ...fields,
      })
      .returning();
    const metadataIds: number[] = [];
    onTestFinished(async () => {
      await database.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateur.id));
      if (metadataIds.length) {
        await database.db
          .delete(indicateurSourceMetadonneeTable)
          .where(inArray(indicateurSourceMetadonneeTable.id, metadataIds));
      }
      await cleanup();
    });

    const valeur: IndicateurValeurCreate = {
      collectiviteId: collectivite.id,
      indicateurId: indicateur.id,
      dateValeur: '2030-01-01',
      periodicite: indicateur.periodicite,
    };
    const createMetadata = async () => {
      const [metadata] = await database.db
        .insert(indicateurSourceMetadonneeTable)
        .values({
          sourceId: ELECTRIFICATION_SOURCE_ID,
          dateVersion: '2026-01-01',
          nomDonnees: `Plan ${randomUUID()}`,
        })
        .returning();
      metadataIds.push(metadata.id);
      return metadata;
    };
    const read = (tx?: Transaction) =>
      (tx ?? database.db)
        .select()
        .from(indicateurValeurTable)
        .where(
          and(
            eq(indicateurValeurTable.collectiviteId, collectivite.id),
            eq(indicateurValeurTable.indicateurId, indicateur.id)
          )
        )
        .orderBy(indicateurValeurTable.id);
    return { user, valeur, indicateur, createMetadata, read };
  }

  async function snapshot(indicateurId: number) {
    const { rows } = await database.db.execute<{
      observation: Record<string, unknown>;
    }>(sql`
      SELECT to_jsonb(v) AS observation FROM public.indicateur_valeur v
      WHERE indicateur_id = ${indicateurId} ORDER BY id
    `);
    return rows.map(({ observation }) => observation);
  }

  test.each([
    { present: 'resultat', missing: 'objectif' },
    { present: 'objectif', missing: 'resultat' },
  ] as const)(
    'préserve $present à zéro, signale son conflit et complète $missing',
    async ({ present, missing }) => {
      const { valeur, user, read } = await fixture();
      await database.db.insert(indicateurValeurTable).values({
        ...valeur,
        [present]: 0,
        resultatCommentaire: 'Commentaire existant',
        createdBy: user.id,
      });
      const result = await service.fillMissing(
        [{ ...valeur, [present]: 99, [missing]: 12 }],
        { user }
      );

      expect(result).toMatchObject({
        success: true,
        data: {
          valeurs: [{ [present]: 0, [missing]: 12 }],
          conflits: [
            {
              ...valeur,
              metadonneeId: null,
              field: present,
              existingValue: 0,
              incomingValue: 99,
            },
          ],
        },
      });
      expect(await read()).toMatchObject([
        {
          [present]: 0,
          [missing]: 12,
          resultatCommentaire: 'Commentaire existant',
        },
      ]);
    }
  );

  test('conserve les commentaires et estimations présents et complète ceux absents', async () => {
    const { valeur, user, read } = await fixture();
    await database.db.insert(indicateurValeurTable).values({
      ...valeur,
      resultat: 10,
      resultatCommentaire: 'Observation conservée',
      estimation: 0,
    });

    const result = await service.fillMissing(
      [
        {
          ...valeur,
          objectif: 20,
          resultatCommentaire: 'Autre observation',
          objectifCommentaire: 'Objectif du document',
          estimation: 42,
        },
      ],
      { user }
    );
    expect(result).toMatchObject({
      success: true,
      data: {
        conflits: expect.arrayContaining([
          {
            ...valeur,
            metadonneeId: null,
            field: 'resultatCommentaire',
            existingValue: 'Observation conservée',
            incomingValue: 'Autre observation',
          },
          {
            ...valeur,
            metadonneeId: null,
            field: 'estimation',
            existingValue: 0,
            incomingValue: 42,
          },
        ]),
      },
    });
    expect(await read()).toMatchObject([
      {
        resultat: 10,
        objectif: 20,
        resultatCommentaire: 'Observation conservée',
        objectifCommentaire: 'Objectif du document',
        estimation: 0,
      },
    ]);
  });

  test('complète une estimation absente sans modifier le résultat', async () => {
    const { valeur, user, read } = await fixture();
    await database.db
      .insert(indicateurValeurTable)
      .values({ ...valeur, resultat: 4 });

    expect(
      await service.fillMissing([{ ...valeur, estimation: 0 }], { user })
    ).toMatchObject({
      success: true,
      data: { valeurs: [{ resultat: 4, estimation: 0 }], conflits: [] },
    });
    expect(await read()).toMatchObject([{ resultat: 4, estimation: 0 }]);
  });

  test('protège une ligne automatique complétée contre les calculs suivants', async () => {
    const { valeur, user, read } = await fixture();
    await database.db.insert(indicateurValeurTable).values({
      ...valeur,
      resultat: 4,
      calculAuto: true,
      calculAutoIdentifiantsManquants: ['source_absente'],
    });
    expect(
      await service.fillMissing([{ ...valeur, objectif: 7 }], { user })
    ).toMatchObject({
      success: true,
      data: {
        valeurs: [
          {
            resultat: 4,
            objectif: 7,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
        ],
        conflits: [],
      },
    });

    expect(
      await service.upsert(
        [{ ...valeur, resultat: 999, objectif: 999, calculAuto: true }],
        { isUserTrusted: true }
      )
    ).toMatchObject({ success: true, data: [] });
    expect(await read()).toMatchObject([
      { resultat: 4, objectif: 7, calculAuto: false },
    ]);
  });

  test('ne crée aucune ligne lorsque résultat et objectif sont absents', async () => {
    const { valeur, user, read } = await fixture();
    expect(
      await service.fillMissing([{ ...valeur, resultat: null }], { user })
    ).toMatchObject({ success: true, data: { valeurs: [], conflits: [] } });
    expect(await read()).toEqual([]);
  });

  test('arrondit les nouvelles valeurs puis préserve entièrement une répétition identique', async () => {
    const { valeur, user } = await fixture();
    const input = [{ ...valeur, resultat: 12.345, objectif: 0 }];
    expect(await service.fillMissing(input, { user })).toMatchObject({
      success: true,
      data: { valeurs: [{ resultat: 12.35, objectif: 0 }], conflits: [] },
    });
    const before = await snapshot(valeur.indicateurId);

    expect(await service.fillMissing(input, { user })).toMatchObject({
      success: true,
      data: { valeurs: [], conflits: [] },
    });
    expect(await snapshot(valeur.indicateurId)).toEqual(before);
  });

  test('ne réarrondit pas une valeur historique lorsqu’une autre cellule est complétée', async () => {
    const { valeur, user, read } = await fixture({ precision: 1 });
    const [existing] = await database.db
      .insert(indicateurValeurTable)
      .values({
        ...valeur,
        resultat: 1.234,
        createdBy: user.id,
        createdAt: '2025-01-01T00:00:00.000Z',
      })
      .returning();
    expect(
      await service.fillMissing([{ ...valeur, objectif: 6.789 }], { user })
    ).toMatchObject({
      success: true,
      data: { valeurs: [{ resultat: 1.234, objectif: 6.8 }], conflits: [] },
    });
    expect(await read()).toMatchObject([
      {
        resultat: 1.234,
        objectif: 6.8,
        createdBy: user.id,
        createdAt: existing.createdAt,
      },
    ]);
  });

  test('fusionne les cellules du lot sur la même année sans perdre leurs conflits', async () => {
    const { valeur, user, read } = await fixture();
    const result = await service.fillMissing(
      [
        { ...valeur, dateValeur: '2030-06-01', resultat: 3 },
        { ...valeur, objectif: 8 },
        { ...valeur, resultat: 5 },
      ],
      { user }
    );
    expect(result).toMatchObject({
      success: true,
      data: {
        valeurs: [{ resultat: 3, objectif: 8 }],
        conflits: [
          {
            ...valeur,
            metadonneeId: null,
            field: 'resultat',
            existingValue: 3,
            incomingValue: 5,
          },
        ],
      },
    });
    expect(await read()).toMatchObject([
      { dateValeur: '2030-01-01', resultat: 3, objectif: 8 },
    ]);
  });

  test('annule insertions et complétions avec la transaction appelante', async () => {
    const { valeur, user } = await fixture();
    await database.db
      .insert(indicateurValeurTable)
      .values({ ...valeur, resultat: 2 });
    const before = await snapshot(valeur.indicateurId);

    await expect(
      database.db.transaction(async (tx) => {
        const result = await service.fillMissing(
          [
            { ...valeur, objectif: 9 },
            { ...valeur, dateValeur: '2031-01-01', resultat: 4 },
          ],
          { user, tx }
        );
        expect(result).toMatchObject({ success: true });
        throw new Error('Annulation du plan');
      })
    ).rejects.toThrow('Annulation du plan');
    expect(await snapshot(valeur.indicateurId)).toEqual(before);
  });

  test.each(['upsert', 'fillMissing'] as const)(
    '%s propage les valeurs puis annule toute la chaîne si un recalcul échoue',
    async (operation) => {
      const source = await fixture();
      const dependent = await fixture({
        valeurCalcule: `val(${source.indicateur.identifiantReferentiel}) * 2`,
      });
      expect(
        await service[operation]([{ ...source.valeur, resultat: 2 }], {
          user: source.user,
        })
      ).toMatchObject({ success: true });
      expect(await snapshot(dependent.indicateur.id)).toMatchObject([
        { resultat: 4, objectif: null, calcul_auto: true },
      ]);
      const beforeSource = await snapshot(source.indicateur.id);
      const beforeDependent = await snapshot(dependent.indicateur.id);
      const compute = app.get(ComputeValeursService);
      const originalCompute =
        compute.updateCalculatedIndicateurValeurs.bind(compute);
      const error = new Error('Échec après écriture du premier calcul');
      let persistedObjective: number | null | undefined;
      const propagation = vi
        .spyOn(compute, 'updateCalculatedIndicateurValeurs')
        .mockImplementation(async (valeurs, tx) => {
          if (
            valeurs.some(
              (valeur) => valeur.indicateurId === dependent.indicateur.id
            )
          ) {
            const [persisted] = await tx
              .select({ objectif: indicateurValeurTable.objectif })
              .from(indicateurValeurTable)
              .where(
                and(
                  eq(
                    indicateurValeurTable.indicateurId,
                    dependent.indicateur.id
                  ),
                  eq(
                    indicateurValeurTable.collectiviteId,
                    source.valeur.collectiviteId
                  )
                )
              );
            persistedObjective = persisted?.objectif;
            throw error;
          }
          return originalCompute(valeurs, tx);
        });
      try {
        expect(
          await service[operation]([{ ...source.valeur, objectif: 7 }], {
            user: source.user,
          })
        ).toMatchObject({
          success: false,
          error: 'DATABASE_ERROR',
          cause: error,
        });
        expect(persistedObjective).toBe(14);
        expect(await snapshot(source.indicateur.id)).toEqual(beforeSource);
        expect(await snapshot(dependent.indicateur.id)).toEqual(
          beforeDependent
        );
      } finally {
        propagation.mockRestore();
      }
    }
  );

  test('refuse atomiquement une période mensuelle non canonique', async () => {
    const { valeur, user, read } = await fixture({ periodicite: 'mensuelle' });
    expect(
      await service.fillMissing(
        [
          { ...valeur, resultat: 1 },
          { ...valeur, dateValeur: '2030-02-15', resultat: 2 },
        ],
        { user }
      )
    ).toMatchObject({ success: false, error: 'INVALID_VALUE' });
    expect(await read()).toEqual([]);
  });

  test('refuse la lecture seule et une clé API privée du droit de saisie', async () => {
    const reader = await fixture({}, CollectiviteRole.LECTURE);
    expect(
      await service.fillMissing([{ ...reader.valeur, resultat: 1 }], {
        user: reader.user,
      })
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    const editor = await fixture();
    const user = {
      ...editor.user,
      jwtPayload: { ...editor.user.jwtPayload, permissions: ['plans.mutate'] },
    };
    expect(
      await service.fillMissing([{ ...editor.valeur, resultat: 1 }], { user })
    ).toMatchObject({
      success: false,
      error: 'UNAUTHORIZED',
    });
    expect(await reader.read()).toEqual([]);
    expect(await editor.read()).toEqual([]);
  });

  test('respecte l’interdiction des valeurs utilisateur et le périmètre des personnalisés', async () => {
    const protectedIndicateur = await fixture({ sansValeurUtilisateur: true });
    expect(
      await service.fillMissing(
        [{ ...protectedIndicateur.valeur, objectif: 1 }],
        { user: protectedIndicateur.user }
      )
    ).toMatchObject({ success: false, error: 'USER_VALUE_NOT_ALLOWED' });
    const owner = await fixture();
    const foreign = await fixture({
      collectiviteId: owner.valeur.collectiviteId,
      identifiantReferentiel: null,
    });
    expect(
      await service.fillMissing([{ ...foreign.valeur, resultat: 1 }], {
        user: foreign.user,
      })
    ).toMatchObject({ success: false, error: 'INVALID_VALUE' });
    expect(await protectedIndicateur.read()).toEqual([]);
    expect(await foreign.read()).toEqual([]);
  });

  test('isole deux métadonnées sans modifier les valeurs de la collectivité', async () => {
    const { valeur, user, createMetadata, read } = await fixture();
    const first = await createMetadata();
    const second = await createMetadata();
    await database.db
      .insert(indicateurValeurTable)
      .values({ ...valeur, resultat: 10, objectif: 100 });
    for (const [metadata, objectif] of [
      [first, 30],
      [second, 60],
    ] as const) {
      expect(
        await service.fillMissing(
          [{ ...valeur, metadonneeId: metadata.id, objectif }],
          {
            user,
            metadataAuthorization: {
              collectiviteId: valeur.collectiviteId,
              metadonneeId: metadata.id,
              sourceId: ELECTRIFICATION_SOURCE_ID,
            },
          }
        )
      ).toMatchObject({
        success: true,
        data: {
          valeurs: [{ metadonneeId: metadata.id, resultat: null, objectif }],
          conflits: [],
        },
      });
    }
    expect(await read()).toMatchObject([
      { metadonneeId: null, resultat: 10, objectif: 100 },
      { metadonneeId: first.id, resultat: null, objectif: 30 },
      { metadonneeId: second.id, resultat: null, objectif: 60 },
    ]);
  });

  test.each([
    'absente',
    'autre-collectivite',
    'autre-metadonnee',
    'autre-source',
  ] as const)(
    'refuse une autorisation de métadonnée %s',
    async (invalidAuthorization) => {
      const { valeur, user, createMetadata, read } = await fixture();
      const metadata = await createMetadata();
      const metadataAuthorization =
        invalidAuthorization === 'absente'
          ? undefined
          : {
              collectiviteId:
                invalidAuthorization === 'autre-collectivite'
                  ? valeur.collectiviteId + 1
                  : valeur.collectiviteId,
              metadonneeId:
                invalidAuthorization === 'autre-metadonnee'
                  ? metadata.id + 1
                  : metadata.id,
              sourceId:
                invalidAuthorization === 'autre-source'
                  ? 'autre-source'
                  : ELECTRIFICATION_SOURCE_ID,
            };
      expect(
        await service.fillMissing(
          [{ ...valeur, metadonneeId: metadata.id, objectif: 1 }],
          { user, metadataAuthorization }
        )
      ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
      expect(await read()).toEqual([]);
    }
  );

  test('relit la saisie concurrente après le verrou et complète uniquement la cellule libre', async () => {
    const { valeur, user, read } = await fixture();
    let fillMissing:
      | Promise<Awaited<ReturnType<typeof service.fillMissing>>>
      | undefined;
    let started!: (pid: number) => void;
    let failed!: (error: unknown) => void;
    const concurrentStarted = new Promise<number>((resolve, reject) => {
      started = resolve;
      failed = reject;
    });
    try {
      await database.db.transaction(async (tx) => {
        const { rows } = await tx.execute<{ pid: number }>(
          sql`SELECT pg_backend_pid() AS pid`
        );
        expect(
          await service.upsert([{ ...valeur, resultat: 0 }], { user, tx })
        ).toMatchObject({ success: true });
        fillMissing = database.db.transaction(async (otherTx) => {
          await otherTx.execute(sql`SET LOCAL statement_timeout = '10s'`);
          const { rows: otherRows } = await otherTx.execute<{ pid: number }>(
            sql`SELECT pg_backend_pid() AS pid`
          );
          started(otherRows[0].pid);
          return service.fillMissing(
            [{ ...valeur, resultat: 999, objectif: 7 }],
            { user, tx: otherTx }
          );
        });
        void fillMissing.catch(failed);
        const pid = await concurrentStarted;
        await vi.waitFor(
          async () => {
            const { rows: blockers } = await database.db.execute<{
              pids: number[];
            }>(sql`SELECT pg_blocking_pids(${pid}) AS pids`);
            expect(blockers[0].pids).toContain(rows[0].pid);
          },
          { timeout: 5000, interval: 20 }
        );
      });
    } finally {
      await fillMissing;
    }
    expect(await fillMissing).toMatchObject({
      success: true,
      data: {
        valeurs: [{ resultat: 0, objectif: 7 }],
        conflits: [{ field: 'resultat', existingValue: 0, incomingValue: 999 }],
      },
    });
    expect(await read()).toMatchObject([{ resultat: 0, objectif: 7 }]);
  });
});
