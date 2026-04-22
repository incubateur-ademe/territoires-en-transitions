import { ForbiddenException, INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { CollectiviteRole } from '@tet/domain/users';
import { createFiche } from '../fiches.test-fixture';

describe('ShareFicheService', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let adminUser1: AuthenticatedUser; // admin on collectivite 1
  let adminUser1Id: string;
  let adminUser3: AuthenticatedUser; // admin on collectivite 3
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    // User with admin on collectivite 1
    const user1Result = await addTestUser(db, {
      collectiviteId: 1,
      role: CollectiviteRole.ADMIN,
    });
    adminUser1 = getAuthUserFromUserCredentials(user1Result.user);
    adminUser1Id = user1Result.user.id;

    // User with admin on collectivite 3
    const user3Result = await addTestUser(db, {
      collectiviteId: 3,
      role: CollectiviteRole.ADMIN,
    });
    adminUser3 = getAuthUserFromUserCredentials(user3Result.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('should share a fiche action with another collectivité and make it visible / editable', async () => {
    const user3Caller = router.createCaller({ user: adminUser3 });
    const ficheId = await createFiche({
      caller: user3Caller,
      ficheInput: { collectiviteId: 3 },
    });

    // Be sure that the fiche is not shared
    await user3Caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    const user1Caller = router.createCaller({ user: adminUser1 });

    // Initially, collectivité 1 should not see the fiche
    const initialFiches = await user1Caller.plans.fiches.listFiches({
      collectiviteId: 1,
    });
    expect(initialFiches.data.find((f) => f.id === ficheId)).toBeUndefined();

    // And can't edit it as well
    await expect(() =>
      user1Caller.plans.fiches.update({
        ficheId,
        ficheFields: {
          titre: 'title update',
        },
      })
    ).toThrowTrpcHttpError(
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${adminUser1Id} n'a pas l'autorisation plans.fiches.update sur la ressource Collectivité 3`
      )
    );

    // Share the fiche with collectivité 1
    await user3Caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [{ id: 1 }],
      },
    });

    // Now collectivité 1 should see the fiche
    const fichesAfterSharing = await user1Caller.plans.fiches.listFiches({
      collectiviteId: 3,
    });
    const sharedFiche = fichesAfterSharing.data.find((f) => f.id === ficheId);
    expect(sharedFiche).toBeDefined();
    expect(sharedFiche?.sharedWithCollectivites).toEqual([
      { id: 1, nom: 'Ambérieu-en-Bugey' },
    ]);

    // And can edit it as well
    const updatedFiche = await user1Caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        titre: 'title update',
      },
    });
    expect(updatedFiche.titre).toBe('title update');

    // Can also do a bulk edit with the fiche
    await user1Caller.plans.fiches.bulkEdit({
      collectiviteId: 3,
      ficheIds: [ficheId],
      statut: 'Bloqué',
    });
    const ficheAfterBulkUpdate = await user1Caller.plans.fiches.get({
      id: ficheId,
    });
    expect(ficheAfterBulkUpdate.statut).toEqual('Bloqué');

    // Restore title & statut
    await user1Caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        titre: sharedFiche?.titre,
        statut: sharedFiche?.statut,
      },
    });

    // Remove sharing
    await user3Caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    const afterRemovalFiches = await user1Caller.plans.fiches.listFiches({
      collectiviteId: 1,
    });

    expect(
      afterRemovalFiches.data.find((f) => f.id === ficheId)
    ).toBeUndefined();
  });

  test('when a restricted fiche action is shared with another collectivité, it can be read by the other collectivité even if it is restricted', async () => {
    // Fresh collectivité + admin for the fiche owner (collA)
    const ownerSetup = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const ownerCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(ownerSetup.user),
    });

    // Fresh collectivité + admin for the recipient of the share (collB)
    const recipientSetup = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const recipientUser = getAuthUserFromUserCredentials(recipientSetup.user);
    const recipientCaller = router.createCaller({ user: recipientUser });

    onTestFinished(async () => {
      await ownerSetup.cleanup();
      await recipientSetup.cleanup();
    });

    // Owner creates a fiche, initially shared with recipient's collectivité
    const ficheId = await createFiche({
      caller: ownerCaller,
      ficheInput: { collectiviteId: ownerSetup.collectivite.id },
    });
    await ownerCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [{ id: recipientSetup.collectivite.id }],
        restreint: false,
      },
      isNotificationEnabled: false,
    });

    // Recipient can read via sharing (non-confidentiel)
    const initialFiche = await recipientCaller.plans.fiches.get({
      id: ficheId,
    });
    expect(initialFiche.id).toBe(ficheId);

    // Make the fiche restricted AND remove sharing: recipient loses access
    await ownerCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        restreint: true,
        sharedWithCollectivites: [],
      },
      isNotificationEnabled: false,
    });
    await expect(() =>
      recipientCaller.plans.fiches.get({ id: ficheId })
    ).toThrowTrpcHttpError(
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${recipientUser.id} n'a pas l'autorisation plans.fiches.read_confidentiel sur la ressource Collectivité ${ownerSetup.collectivite.id}`
      )
    );

    // Re-share the restricted fiche with recipient's collectivité: recipient regains access
    await ownerCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [{ id: recipientSetup.collectivite.id }],
      },
      isNotificationEnabled: false,
    });
    const sharedFiche = await recipientCaller.plans.fiches.get({ id: ficheId });
    expect(sharedFiche.id).toBe(ficheId);
    expect(sharedFiche.restreint).toBe(true);
    expect(sharedFiche.sharedWithCollectivites).toEqual([
      {
        id: recipientSetup.collectivite.id,
        nom: recipientSetup.collectivite.nom,
      },
    ]);
  });
});
