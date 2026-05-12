import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { preuveComplementaireTable } from '@tet/backend/collectivites/documents/models/preuve-complementaire.table';
import { preuveReglementaireTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { cleanupReferentielActionStatutsAndLabellisations } from '../update-action-statut/referentiel-action-statut.test-fixture';

/** lien preuve_action présent en base (preuve réglementaire rattachée à la sous-action cae_1.1.3.2) */
const PREUVE_REGLEMENTAIRE = {
  preuveId: 'etude_vulnerabiliteCC',
  actionId: 'cae_1.1.3.2',
} as const;

describe('CountPreuvesRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const fixture = await addTestCollectiviteAndUsers(databaseService, {
      users: [{ role: CollectiviteRole.EDITION }],
    });
    collectivite = fixture.collectivite;
    editorUser = getAuthUserFromUserCredentials(fixture.users[0]);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await cleanupReferentielActionStatutsAndLabellisations(
      databaseService,
      collectivite.id
    );
  });

  /** insère une preuve réglementaire */
  async function addTestPreuveReglementaire(params: {
    databaseService: DatabaseService;
    collectiviteId: number;
    modifiedBy: string;
    preuveId: string;
    actionId: string;
    titre?: string;
    url?: string;
  }): Promise<{ preuveId: string; actionId: string }> {
    await params.databaseService.db.insert(preuveReglementaireTable).values({
      collectiviteId: params.collectiviteId,
      preuveId: params.preuveId,
      titre: params.titre ?? 'preuve reg',
      url: params.url ?? 'https://example.com/reg',
      modifiedBy: params.modifiedBy,
    });

    return { preuveId: params.preuveId, actionId: params.actionId };
  }

  /** insère une preuve complémentaire */
  async function addTestPreuveComplementaire(params: {
    databaseService: DatabaseService;
    collectiviteId: number;
    modifiedBy: string;
    values: Array<{ actionId: string; titre: string; url: string }>;
  }): Promise<void> {
    await params.databaseService.db.insert(preuveComplementaireTable).values(
      params.values.map((v) => ({
        collectiviteId: params.collectiviteId,
        actionId: v.actionId,
        titre: v.titre,
        url: v.url,
        modifiedBy: params.modifiedBy,
      }))
    );
  }

  test('renvoie 0 et un tableau vide si quand aucune preuve', async () => {
    const caller = router.createCaller({ user: editorUser });
    const result = await caller.referentiels.actions.countPreuves({
      collectiviteId: collectivite.id,
      actionId: 'cae_1.1.3',
    });
    expect(result.total).toBe(0);
    expect(result.children).toEqual([]);
  });

  test('compte les preuves complémentaires sur la mesure et ses descendants', async () => {
    await addTestPreuveComplementaire({
      databaseService,
      collectiviteId: collectivite.id,
      modifiedBy: editorUser.id,
      values: [
        {
          actionId: 'cae_1.1.3',
          titre: 'doc racine',
          url: 'https://example.com/doc-racine',
        },
        {
          actionId: 'cae_1.1.3.1',
          titre: 'doc sous-action 1',
          url: 'https://example.com/doc-d1',
        },
        {
          actionId: 'cae_1.1.3.1.1',
          titre: 'doc tâche 1.1',
          url: 'https://example.com/doc-t1',
        },
        {
          actionId: 'cae_1.1.3.1.2',
          titre: 'doc tâche 2a',
          url: 'https://example.com/doc-t2a',
        },
        {
          actionId: 'cae_1.1.3.1.2',
          titre: 'doc tâche 2b',
          url: 'https://example.com/doc-t2b',
        },
      ],
    });

    const caller = router.createCaller({ user: editorUser });
    const result = await caller.referentiels.actions.countPreuves({
      collectiviteId: collectivite.id,
      actionId: 'cae_1.1.3',
    });
    expect(result.total).toBe(5);
    expect(result.children).toEqual([
      { actionId: 'cae_1.1.3', count: 1, total: 5 },
      { actionId: 'cae_1.1.3.1', count: 1, total: 4 },
      { actionId: 'cae_1.1.3.1.1', count: 1, total: 1 },
      { actionId: 'cae_1.1.3.1.2', count: 2, total: 2 },
    ]);
  });

  test('ne compte pas les preuves sur une branche au même niveau', async () => {
    await addTestPreuveComplementaire({
      databaseService,
      collectiviteId: collectivite.id,
      modifiedBy: editorUser.id,
      values: [
        {
          actionId: 'cae_1.1.3',
          titre: 'sur la mesure',
          url: 'https://example.com/s1',
        },
        {
          actionId: 'cae_1.1.2',
          titre: 'sur branche sibling',
          url: 'https://example.com/sibling',
        },
      ],
    });

    const caller = router.createCaller({ user: editorUser });
    const result = await caller.referentiels.actions.countPreuves({
      collectiviteId: collectivite.id,
      actionId: 'cae_1.1.3',
    });

    expect(result.total).toBe(1);
    expect(result.children).toEqual([
      { actionId: 'cae_1.1.3', count: 1, total: 1 },
    ]);
  });

  test('compte les preuves réglementaires associées à la mesure', async () => {
    await addTestPreuveReglementaire({
      databaseService,
      collectiviteId: collectivite.id,
      modifiedBy: editorUser.id,
      preuveId: PREUVE_REGLEMENTAIRE.preuveId,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
    });

    const caller = router.createCaller({ user: editorUser });
    const result = await caller.referentiels.actions.countPreuves({
      collectiviteId: collectivite.id,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
    });

    expect(result.total).toBe(1);
    expect(result.children).toEqual([
      { actionId: 'cae_1.1.3.2', count: 1, total: 1 },
    ]);
  });

  test('somme les preuves complémentaires et réglementaires pour la même mesure', async () => {
    await addTestPreuveReglementaire({
      databaseService,
      collectiviteId: collectivite.id,
      modifiedBy: editorUser.id,
      titre: 'réglementaire',
      url: 'https://example.com/reg',
      preuveId: PREUVE_REGLEMENTAIRE.preuveId,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
    });

    await addTestPreuveComplementaire({
      databaseService,
      collectiviteId: collectivite.id,
      modifiedBy: editorUser.id,
      values: [
        {
          actionId: PREUVE_REGLEMENTAIRE.actionId,
          titre: 'complémentaire 1',
          url: 'https://example.com/comp-1',
        },
        {
          actionId: PREUVE_REGLEMENTAIRE.actionId,
          titre: 'complémentaire 2',
          url: 'https://example.com/comp-2',
        },
      ],
    });

    const caller = router.createCaller({ user: editorUser });
    const result = await caller.referentiels.actions.countPreuves({
      collectiviteId: collectivite.id,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
    });

    // 2 complémentaires + 1 réglementaire sur la même mesure
    expect(result.total).toBe(3);
    expect(result.children).toEqual([
      { actionId: 'cae_1.1.3.2', count: 3, total: 3 },
    ]);
  });

  test('somme complémentaire sur un parent et réglementaire sur un descendant', async () => {
    await addTestPreuveReglementaire({
      databaseService,
      collectiviteId: collectivite.id,
      modifiedBy: editorUser.id,
      titre: 'réglementaire descendant',
      url: 'https://example.com/reg-desc',
      preuveId: PREUVE_REGLEMENTAIRE.preuveId,
      actionId: PREUVE_REGLEMENTAIRE.actionId,
    });

    await addTestPreuveComplementaire({
      databaseService,
      collectiviteId: collectivite.id,
      modifiedBy: editorUser.id,
      values: [
        {
          actionId: 'cae_1.1.3',
          titre: 'complémentaire parent',
          url: 'https://example.com/comp-parent',
        },
      ],
    });

    const caller = router.createCaller({ user: editorUser });
    const result = await caller.referentiels.actions.countPreuves({
      collectiviteId: collectivite.id,
      actionId: 'cae_1.1.3',
    });

    // 1 complémentaire sur la racine + 1 réglementaire sur une mesure descendante
    expect(result.total).toBe(2);
    expect(result.children).toEqual([
      { actionId: 'cae_1.1.3', count: 1, total: 2 },
      { actionId: 'cae_1.1.3.2', count: 1, total: 1 },
    ]);
  });

  test('refuse un utilisateur non vérifié sans rattachement collectivité', async () => {
    const { user, cleanup } = await addTestUser(databaseService, {
      collectiviteId: null,
      verified: false,
    });
    onTestFinished(() => cleanup());

    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    await expect(
      caller.referentiels.actions.countPreuves({
        collectiviteId: collectivite.id,
        actionId: 'cae_1.1.3',
      })
    ).rejects.toThrowError(/droits insuffisants/i);
  });
});
