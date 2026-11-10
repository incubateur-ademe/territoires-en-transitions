import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { groupementCollectiviteTable } from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { createGroupement } from '@tet/backend/collectivites/shared/models/groupement.test-fixture';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { failure } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { indicateurCollectiviteTable } from '../../indicateur/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { indicateurValeurTable } from '../../valeurs/indicateur-valeur.table';
import CreateIndicateurService from '../mutate-indicateur/create-indicateur.service';
import { createIndicateurInputSchema } from '../mutate-indicateur/mutate-indicateur.input';
import { AddIndicateurLinksService } from './add-indicateur-links.service';

describe('Ajout transactionnel des liens d’un indicateur', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let service: AddIndicateurLinksService;
  let transactions: TransactionManager;
  let fixtures: Awaited<ReturnType<typeof addTestCollectiviteAndUser>>[];
  let groupements: Awaited<ReturnType<typeof createGroupement>>[];
  let indicateurIds: number[];
  let context: Awaited<ReturnType<typeof createContext>>;
  const llm = new FakeLlmRepository();

  const createContext = async (
    role: CollectiviteRole = CollectiviteRole.EDITION
  ) => {
    const fixture = await addTestCollectiviteAndUser(db, { user: { role } });
    fixtures.push(fixture);
    return {
      collectiviteId: fixture.collectivite.id,
      user: getAuthUserFromUserCredentials(fixture.user),
    };
  };
  const createIndicateur = async (
    fields: Partial<typeof indicateurDefinitionTable.$inferInsert> = {}
  ) => {
    const [indicateur] = await db.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Indicateur existant',
        unite: 'MWh',
        ...fields,
      })
      .returning();
    indicateurIds.push(indicateur.id);
    return indicateur;
  };
  const createAxe = async (collectiviteId = context.collectiviteId) => {
    const [axe] = await db.db
      .insert(axeTable)
      .values({ collectiviteId, nom: 'Axe de test' })
      .returning();
    return axe;
  };
  const createFiche = async (
    fields: Partial<typeof ficheActionTable.$inferInsert> = {}
  ) => {
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Fiche existante',
        ...fields,
      })
      .returning();
    return fiche;
  };
  const addLinks = (
    input: Omit<
      Parameters<AddIndicateurLinksService['addLinks']>[0],
      'collectiviteId'
    >,
    user = context.user
  ) =>
    transactions.executeSingle((tx) =>
      service.addLinks(
        { collectiviteId: context.collectiviteId, ...input },
        { user, tx }
      )
    );
  const listLinks = async (indicateurId: number) => ({
    axes: await db.db
      .select()
      .from(axeIndicateurTable)
      .where(eq(axeIndicateurTable.indicateurId, indicateurId)),
    fiches: await db.db
      .select()
      .from(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.indicateurId, indicateurId)),
  });
  const grantEdition = async (collectiviteId: number) => {
    await db.db.insert(utilisateurCollectiviteAccessTable).values({
      collectiviteId,
      userId: context.user.id,
      role: CollectiviteRole.EDITION,
      isActive: true,
    });
  };

  // Observe un verrou PostgreSQL réel, puis attend la fin de l'opération concurrente.
  const expectBlockedUntilCommit = async (
    link: (tx: Transaction) => Promise<unknown>,
    mutate: (tx: Transaction) => Promise<unknown>
  ) => {
    let signalStarted!: (pid: number) => void;
    let signalFailure!: (error: unknown) => void;
    const started = new Promise<number>((resolve, reject) => {
      signalStarted = resolve;
      signalFailure = reject;
    });
    let concurrent: Promise<void> | undefined;
    try {
      await db.db.transaction(async (tx) => {
        const { rows } = await tx.execute<{ pid: number }>(
          sql`SELECT pg_backend_pid() AS pid`
        );
        await link(tx);
        concurrent = db.db.transaction(async (otherTx) => {
          await otherTx.execute(sql`SET LOCAL statement_timeout = '10s'`);
          const { rows: otherRows } = await otherTx.execute<{ pid: number }>(
            sql`SELECT pg_backend_pid() AS pid`
          );
          signalStarted(otherRows[0].pid);
          await mutate(otherTx);
        });
        void concurrent.catch(signalFailure);
        const pid = await started;
        await vi.waitFor(
          async () => {
            const { rows: blockers } = await db.db.execute<{ pids: number[] }>(
              sql`SELECT pg_blocking_pids(${pid}) AS pids`
            );
            expect(blockers[0].pids).toContain(rows[0].pid);
          },
          { timeout: 5000, interval: 20 }
        );
      });
    } finally {
      await concurrent;
    }
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(LlmService).useValue(new LlmService(llm));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    db = await getTestDatabase(app);
    service = app.get(AddIndicateurLinksService);
    transactions = app.get(TransactionManager);
  });
  beforeEach(async () => {
    fixtures = [];
    groupements = [];
    indicateurIds = [];
    context = await createContext();
    vi.spyOn(llm, 'complete');
    vi.spyOn(llm, 'chat');
  });
  afterEach(async () => {
    expect(llm.complete).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    const collectiviteIds = fixtures.map(({ collectivite }) => collectivite.id);
    const fiches = db.db
      .select({ id: ficheActionTable.id })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.collectiviteId, collectiviteIds));
    await db.db
      .delete(ficheActionIndicateurTable)
      .where(inArray(ficheActionIndicateurTable.ficheId, fiches));
    await db.db
      .delete(ficheActionSharingTable)
      .where(inArray(ficheActionSharingTable.ficheId, fiches));
    await db.db
      .delete(ficheActionTable)
      .where(inArray(ficheActionTable.collectiviteId, collectiviteIds));
    await db.db
      .delete(axeTable)
      .where(inArray(axeTable.collectiviteId, collectiviteIds));
    if (indicateurIds.length) {
      await db.db
        .delete(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, indicateurIds));
    }
    for (const groupement of groupements) await groupement.cleanup();
    // Un même utilisateur peut avoir été autorisé sur plusieurs fixtures.
    await db.db
      .delete(utilisateurCollectiviteAccessTable)
      .where(
        inArray(
          utilisateurCollectiviteAccessTable.collectiviteId,
          collectiviteIds
        )
      );
    for (const fixture of fixtures.reverse()) await fixture.cleanup();
  });
  afterAll(async () => {
    await app.close();
  });

  test('ajoute sans remplacer les liens existants et conserve leur audit après un nouvel appel', async () => {
    const indicateur = await createIndicateur();
    const oldAxe = await createAxe();
    const newAxe = await createAxe();
    const oldFiche = await createFiche();
    const newFiche = await createFiche();
    const [existingAxeLink] = await db.db
      .insert(axeIndicateurTable)
      .values({
        axeId: oldAxe.id,
        indicateurId: indicateur.id,
        createdBy: context.user.id,
      })
      .returning();
    const [existingFicheLink] = await db.db
      .insert(ficheActionIndicateurTable)
      .values({
        ficheId: oldFiche.id,
        indicateurId: indicateur.id,
        createdBy: context.user.id,
      })
      .returning();
    const input = {
      indicateurId: indicateur.id,
      axeIds: [newAxe.id, newAxe.id],
      ficheIds: [newFiche.id, newFiche.id],
    };

    expect(await addLinks(input)).toEqual({ success: true, data: undefined });
    const beforeRetry = await listLinks(indicateur.id);
    expect(beforeRetry.axes).toHaveLength(2);
    expect(beforeRetry.fiches).toHaveLength(2);
    expect(beforeRetry.axes).toContainEqual(existingAxeLink);
    expect(beforeRetry.fiches).toContainEqual(existingFicheLink);
    expect(beforeRetry.axes).toContainEqual(
      expect.objectContaining({ axeId: newAxe.id, createdBy: context.user.id })
    );
    expect(beforeRetry.fiches).toContainEqual(
      expect.objectContaining({
        ficheId: newFiche.id,
        createdBy: context.user.id,
      })
    );
    expect((await addLinks(input)).success).toBe(true);
    expect(await listLinks(indicateur.id)).toEqual(beforeRetry);
  });

  test('préserve le titre prédéfini, les préférences, les valeurs et le contenu de la fiche', async () => {
    const indicateur = await createIndicateur({
      collectiviteId: null,
      identifiantReferentiel: `test-${randomUUID()}`,
    });
    const fiche = await createFiche({ description: 'Contenu à conserver' });
    const axe = await createAxe();
    const [preferences] = await db.db
      .insert(indicateurCollectiviteTable)
      .values({
        indicateurId: indicateur.id,
        collectiviteId: context.collectiviteId,
        favoris: true,
        confidentiel: true,
        commentaire: 'Note existante',
      })
      .returning();
    const [valeur] = await db.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: indicateur.id,
        collectiviteId: context.collectiviteId,
        dateValeur: '2026-01-01',
        resultat: 0,
        objectif: 12,
      })
      .returning();

    expect(
      (
        await addLinks({
          indicateurId: indicateur.id,
          axeIds: [axe.id],
          ficheIds: [fiche.id],
        })
      ).success
    ).toBe(true);

    expect(
      await db.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateur.id))
    ).toEqual([indicateur]);
    expect(
      await db.db
        .select()
        .from(indicateurCollectiviteTable)
        .where(eq(indicateurCollectiviteTable.indicateurId, indicateur.id))
    ).toEqual([preferences]);
    expect(
      await db.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateur.id))
    ).toEqual([valeur]);
    expect(
      await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, fiche.id))
    ).toEqual([fiche]);
  });

  test('annule les liens quand la transaction appelante échoue ensuite', async () => {
    const indicateur = await createIndicateur();
    const axe = await createAxe();
    const fiche = await createFiche();
    const result = await transactions.executeSingle(async (tx) => {
      const linked = await service.addLinks(
        {
          collectiviteId: context.collectiviteId,
          indicateurId: indicateur.id,
          axeIds: [axe.id],
          ficheIds: [fiche.id],
        },
        { user: context.user, tx }
      );
      expect(linked.success).toBe(true);
      return failure('LATER_FAILURE');
    });
    expect(result).toMatchObject({ success: false, error: 'LATER_FAILURE' });
    expect(await listLinks(indicateur.id)).toEqual({ axes: [], fiches: [] });
  });

  test('refuse un axe étranger sans créer les autres liens de la requête', async () => {
    const other = await createContext();
    await grantEdition(other.collectiviteId);
    const indicateur = await createIndicateur();
    const foreignAxe = await createAxe(other.collectiviteId);
    const fiche = await createFiche();
    expect(
      await addLinks({
        indicateurId: indicateur.id,
        axeIds: [foreignAxe.id],
        ficheIds: [fiche.id],
      })
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(await listLinks(indicateur.id)).toEqual({ axes: [], fiches: [] });
  });

  test('refuse un personnalisé étranger même avec des droits sur les deux collectivités', async () => {
    const other = await createContext();
    await grantEdition(other.collectiviteId);
    const indicateur = await createIndicateur({
      collectiviteId: other.collectiviteId,
    });
    const axe = await createAxe();
    expect(
      await addLinks({ indicateurId: indicateur.id, axeIds: [axe.id] })
    ).toMatchObject({ success: false, error: 'NOT_FOUND' });
    expect(await listLinks(indicateur.id)).toEqual({ axes: [], fiches: [] });
  });

  test('refuse un indicateur introuvable', async () => {
    const axe = await createAxe();
    expect(
      await addLinks({ indicateurId: 2147483647, axeIds: [axe.id] })
    ).toMatchObject({ success: false, error: 'NOT_FOUND' });
  });

  test('refuse les utilisateurs en lecture seule et les clés API sans permission indicateur', async () => {
    context = await createContext(CollectiviteRole.LECTURE);
    const indicateur = await createIndicateur();
    const fiche = await createFiche();
    expect(
      await addLinks({ indicateurId: indicateur.id, ficheIds: [fiche.id] })
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    const editor = await createContext();
    context = editor;
    const ownIndicateur = await createIndicateur();
    const axe = await createAxe();
    const restrictedUser = {
      ...editor.user,
      jwtPayload: { ...editor.user.jwtPayload, permissions: ['plans.mutate'] },
    };
    expect(
      await addLinks(
        { indicateurId: ownIndicateur.id, axeIds: [axe.id] },
        restrictedUser
      )
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
  });

  test('refuse une clé API autorisée sur les indicateurs mais pas sur les plans', async () => {
    const indicateur = await createIndicateur();
    const axe = await createAxe();
    const restrictedUser = {
      ...context.user,
      jwtPayload: {
        ...context.user.jwtPayload,
        permissions: ['indicateurs.indicateurs.update'],
      },
    };

    expect(
      await addLinks(
        { indicateurId: indicateur.id, axeIds: [axe.id] },
        restrictedUser
      )
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(await listLinks(indicateur.id)).toEqual({ axes: [], fiches: [] });
  });

  test('réévalue l’appartenance au groupement avant chaque liaison', async () => {
    const groupement = await createGroupement({
      database: db,
      groupementData: {},
    });
    groupements.push(groupement);
    const indicateur = await createIndicateur({
      collectiviteId: null,
      groupementId: groupement.id,
      identifiantReferentiel: `test-${randomUUID()}`,
    });
    const axe = await createAxe();
    const input = { indicateurId: indicateur.id, axeIds: [axe.id] };
    expect(await addLinks(input)).toMatchObject({
      success: false,
      error: 'NOT_FOUND',
    });
    await db.db.insert(groupementCollectiviteTable).values({
      groupementId: groupement.id,
      collectiviteId: context.collectiviteId,
    });
    expect((await addLinks(input)).success).toBe(true);
    await db.db
      .delete(groupementCollectiviteTable)
      .where(eq(groupementCollectiviteTable.groupementId, groupement.id));
    const anotherAxe = await createAxe();
    expect(
      await addLinks({ indicateurId: indicateur.id, axeIds: [anotherAxe.id] })
    ).toMatchObject({ success: false, error: 'NOT_FOUND' });
    expect((await listLinks(indicateur.id)).axes).toHaveLength(1);
  });

  test('exige le partage de la fiche étrangère même avec le droit de la modifier', async () => {
    const owner = await createContext();
    await grantEdition(owner.collectiviteId);
    const fiche = await createFiche({
      collectiviteId: owner.collectiviteId,
      restreint: true,
    });
    const indicateur = await createIndicateur();
    const input = { indicateurId: indicateur.id, ficheIds: [fiche.id] };
    expect(await addLinks(input)).toMatchObject({
      success: false,
      error: 'UNAUTHORIZED',
    });
    await db.db
      .insert(ficheActionSharingTable)
      .values({ ficheId: fiche.id, collectiviteId: context.collectiviteId });
    expect((await addLinks(input)).success).toBe(true);
    expect((await listLinks(indicateur.id)).fiches).toHaveLength(1);
    expect(
      await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, fiche.id))
    ).toEqual([fiche]);
  });

  test('refuse les fiches supprimées ou introuvables sans ajouter le lien d’axe', async () => {
    const indicateur = await createIndicateur();
    const axe = await createAxe();
    const deleted = await createFiche({ deleted: true });
    for (const ficheId of [deleted.id, 2147483647]) {
      expect(
        await addLinks({
          indicateurId: indicateur.id,
          axeIds: [axe.id],
          ficheIds: [ficheId],
        })
      ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    }
    expect(await listLinks(indicateur.id)).toEqual({ axes: [], fiches: [] });
  });

  test('une révocation concurrente du partage attend le commit de la liaison', async () => {
    const owner = await createContext();
    const fiche = await createFiche({ collectiviteId: owner.collectiviteId });
    const indicateur = await createIndicateur();
    await db.db
      .insert(ficheActionSharingTable)
      .values({ ficheId: fiche.id, collectiviteId: context.collectiviteId });
    await expectBlockedUntilCommit(
      async (tx) => {
        expect(
          (
            await service.addLinks(
              {
                collectiviteId: context.collectiviteId,
                indicateurId: indicateur.id,
                ficheIds: [fiche.id],
              },
              { user: context.user, tx }
            )
          ).success
        ).toBe(true);
      },
      (tx) =>
        tx
          .delete(ficheActionSharingTable)
          .where(eq(ficheActionSharingTable.ficheId, fiche.id))
    );
    expect(
      await addLinks({ indicateurId: indicateur.id, ficheIds: [fiche.id] })
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
  });

  test('une mutation concurrente du graphe attend la fin de la transaction de liaison', async () => {
    const indicateur = await createIndicateur();
    const axe = await createAxe();
    await expectBlockedUntilCommit(
      async (tx) => {
        expect(
          (
            await service.addLinks(
              {
                collectiviteId: context.collectiviteId,
                indicateurId: indicateur.id,
                axeIds: [axe.id],
              },
              { user: context.user, tx }
            )
          ).success
        ).toBe(true);
      },
      (tx) => app.get(IndicateurLockRepository).lockForIndicateurMutation(tx)
    );
    expect((await listLinks(indicateur.id)).axes).toHaveLength(1);
  });

  test('compose créations et liens en prenant le verrou exclusif avant les lectures des définitions', async () => {
    const locks = app.get(IndicateurLockRepository);
    const lockMutation = vi.spyOn(locks, 'lockForIndicateurMutation');
    const lockDefinitions = vi.spyOn(locks, 'lockIndicateurs');
    const existing = await createIndicateur();
    const axe = await createAxe();
    const fiche = await createFiche();
    const result = await transactions.executeSingle(async (tx) => {
      await locks.lockForIndicateurMutation(tx);
      expect(
        (
          await service.addLinks(
            {
              collectiviteId: context.collectiviteId,
              indicateurId: existing.id,
              axeIds: [axe.id],
            },
            { user: context.user, tx }
          )
        ).success
      ).toBe(true);
      const createdId = await app
        .get(CreateIndicateurService)
        .createIndicateurPerso(
          createIndicateurInputSchema.parse({
            collectiviteId: context.collectiviteId,
            titre: 'Indicateur du même lot',
          }),
          { user: context.user, tx }
        );
      indicateurIds.push(createdId);
      return service.addLinks(
        {
          collectiviteId: context.collectiviteId,
          indicateurId: createdId,
          ficheIds: [fiche.id],
        },
        { user: context.user, tx }
      );
    });
    expect(result.success).toBe(true);
    expect(lockMutation.mock.invocationCallOrder[0]).toBeLessThan(
      lockDefinitions.mock.invocationCallOrder[0]
    );
    expect((await listLinks(existing.id)).axes).toHaveLength(1);
    expect(indicateurIds).toHaveLength(2);
    expect((await listLinks(indicateurIds[1])).fiches).toHaveLength(1);
  });
});
