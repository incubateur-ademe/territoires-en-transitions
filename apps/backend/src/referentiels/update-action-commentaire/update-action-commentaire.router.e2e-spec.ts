import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { actionCommentaireTable } from '../models/action-commentaire.table';
import { historiqueActionCommentaireTable } from '../models/historique-action-commentaire.table';
import { createAuditWithOnTestFinished } from '../referentiels.test-fixture';
import { cleanupReferentielActionStatutsAndLabellisations } from '../update-action-statut/referentiel-action-statut.test-fixture';

type Input = inferProcedureInput<
  AppRouter['referentiels']['actions']['updateCommentaire']
>;

describe('UpdateActionCommentaireRouter', () => {
  let router: TrpcRouter;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let adminUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let databaseService: DatabaseService;
  let input: Input;
  let app: Awaited<ReturnType<typeof getTestApp>>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          {
            role: CollectiviteRole.EDITION,
          },
          {
            role: CollectiviteRole.LECTURE,
          },
          {
            role: CollectiviteRole.ADMIN,
          },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[0]
    );
    readerUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[1]
    );
    adminUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[2]
    );

    input = {
      collectiviteId: collectivite.id,
      actionId: 'cae_1.1.1.1.2',
      commentaire: 'Mon commentaire de précision',
    };
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(async () => {
    await cleanupReferentielActionStatutsAndLabellisations(
      databaseService,
      collectivite.id
    );
  });

  test('not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.updateCommentaire(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('not authorized: accès en lecture uniquement', async () => {
    const caller = router.createCaller({ user: readerUser });

    await expect(() =>
      caller.referentiels.actions.updateCommentaire(input)
    ).rejects.toThrowError(/permissions nécessaires/i);
  });

  test('Action inexistante', async () => {
    const caller = router.createCaller({ user: editorUser });

    await expect(() =>
      caller.referentiels.actions.updateCommentaire({
        ...input,
        actionId: 'cae_1.1.1.11',
      })
    ).rejects.toThrowError(
      /L'action demandée n'existe pas pour ce référentiel/i
    );
  });

  test('Mise à jour du commentaire avec succès', async () => {
    const caller = router.createCaller({ user: editorUser });

    await caller.referentiels.actions.updateCommentaire(input);

    const rows = await databaseService.db
      .select()
      .from(actionCommentaireTable)
      .where(eq(actionCommentaireTable.collectiviteId, collectivite.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      collectiviteId: collectivite.id,
      actionId: 'cae_1.1.1.1.2',
      commentaire: 'Mon commentaire de précision',
      modifiedBy: editorUser.id,
    });
  });

  test('Editor can update commentaire even during audit', async () => {
    const caller = router.createCaller({ user: editorUser });

    await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
    });

    await caller.referentiels.actions.updateCommentaire(input);

    const rows = await databaseService.db
      .select()
      .from(actionCommentaireTable)
      .where(eq(actionCommentaireTable.collectiviteId, collectivite.id));

    expect(rows).toHaveLength(1);
    expect(rows[0].commentaire).toBe('Mon commentaire de précision');
  });

  test("L'historique est créé lors de la mise à jour du commentaire", async () => {
    const caller = router.createCaller({ user: editorUser });
    await caller.referentiels.actions.updateCommentaire(input);

    const historyRows = await databaseService.db
      .select()
      .from(historiqueActionCommentaireTable)
      .where(
        and(
          eq(historiqueActionCommentaireTable.collectiviteId, collectivite.id),
          eq(historiqueActionCommentaireTable.actionId, 'cae_1.1.1.1.2')
        )
      );

    expect(historyRows).toHaveLength(1);
    expect(historyRows[0].precision).toBe('Mon commentaire de précision');
    expect(historyRows[0].previousPrecision).toBeNull();
    expect(historyRows[0].modifiedBy).toBe(editorUser.id);
  });

  test("L'historique est dédupliqué pour les modifications rapprochées", async () => {
    const caller = router.createCaller({ user: editorUser });

    await caller.referentiels.actions.updateCommentaire(input);
    await caller.referentiels.actions.updateCommentaire({
      ...input,
      commentaire: 'Commentaire modifié par éditeur',
    });

    const historyRows = await databaseService.db
      .select()
      .from(historiqueActionCommentaireTable)
      .where(
        and(
          eq(historiqueActionCommentaireTable.collectiviteId, collectivite.id),
          eq(historiqueActionCommentaireTable.actionId, 'cae_1.1.1.1.2')
        )
      );

    expect(historyRows).toHaveLength(1);
    expect(historyRows[0].precision).toBe('Commentaire modifié par éditeur');

    // Third update by admin user
    const adminCaller = router.createCaller({ user: adminUser });
    await adminCaller.referentiels.actions.updateCommentaire({
      ...input,
      commentaire: 'Commentaire modifié par admin',
    });

    const historyRowsAfterAdminUpdate = await databaseService.db
      .select()
      .from(historiqueActionCommentaireTable)
      .where(
        and(
          eq(historiqueActionCommentaireTable.collectiviteId, collectivite.id),
          eq(historiqueActionCommentaireTable.actionId, 'cae_1.1.1.1.2')
        )
      );

    expect(historyRowsAfterAdminUpdate).toHaveLength(2);
    const adminHistoryRow = historyRowsAfterAdminUpdate.find(
      (row) => row.modifiedBy === adminUser.id
    );
    expect(adminHistoryRow).toMatchObject({
      precision: 'Commentaire modifié par admin',
      previousPrecision: 'Commentaire modifié par éditeur',
      modifiedBy: adminUser.id,
      previousModifiedBy: editorUser.id,
    });
    const editorHistoryRow = historyRowsAfterAdminUpdate.find(
      (row) => row.modifiedBy === editorUser.id
    );
    expect(editorHistoryRow?.precision).toBe('Commentaire modifié par éditeur');
  });
});
