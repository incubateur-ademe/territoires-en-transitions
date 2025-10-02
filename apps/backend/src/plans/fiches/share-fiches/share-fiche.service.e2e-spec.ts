import {
  YOLO_DODO,
  YULU_DUDU,
  createFiche,
  getAuthUser,
  getTestApp,
  getTestDatabase,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { ForbiddenException, INestApplication } from '@nestjs/common';

describe('ShareFicheService', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let yuluDuduUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser();
    databaseService = await getTestDatabase(app);
    yuluDuduUser = await getAuthUser(YULU_DUDU);
  });

  test('should share a fiche action with another collectivité and make it visible / editable', async () => {
    const fiche = await createFiche({
      collectiviteId: YULU_DUDU.collectiviteId.admin,
      db: databaseService,
    });
    const ficheId = fiche.id;
    const yolododoCaller = router.createCaller({ user: yoloDodoUser });

    const yulududuCaller = router.createCaller({ user: yuluDuduUser });

    // Be sure that the fiche is not shared
    await yulududuCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    // Initially, collectivité 3 should not see the fiche
    const initialFiches = await yolododoCaller.plans.fiches.listFiches({
      collectiviteId: 1,
    });
    expect(initialFiches.data.find((f) => f.id === ficheId)).toBeUndefined();

    // And can't edit it as well
    await expect(() =>
      yolododoCaller.plans.fiches.update({
        ficheId,
        ficheFields: {
          titre: 'title update',
        },
      })
    ).toThrowTrpcHttpError(
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${YOLO_DODO.id} n'a pas l'autorisation plans.fiches.edition sur la ressource Collectivité 3`
      )
    );

    // Share the fiche with collectivité 3
    await yulududuCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [{ id: YOLO_DODO.collectiviteId.admin }],
      },
    });

    // Now collectivité 3 should see the fiche
    const fichesAfterSharing = await yolododoCaller.plans.fiches.listFiches({
      collectiviteId: 3,
    });
    const sharedFiche = fichesAfterSharing.data.find((f) => f.id === ficheId);
    expect(sharedFiche).toBeDefined();
    expect(sharedFiche?.sharedWithCollectivites).toEqual([
      { id: YOLO_DODO.collectiviteId.admin, nom: 'Ambérieu-en-Bugey' },
    ]);

    // And can edit it as well
    const updatedFiche = await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        titre: 'title update',
      },
    });
    expect(updatedFiche.titre).toBe('title update');

    // Can also do a bulk edit with the fiche
    await yolododoCaller.plans.fiches.bulkEdit({
      collectiviteId: YULU_DUDU.collectiviteId.admin,
      ficheIds: [ficheId],
      statut: 'Bloqué',
    });
    const ficheAfterBulkUpdate = await yolododoCaller.plans.fiches.get({
      id: ficheId,
    });
    expect(ficheAfterBulkUpdate.statut).toEqual('Bloqué');

    // Restore title & statut
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        titre: sharedFiche?.titre,
        statut: sharedFiche?.statut,
      },
    });

    // Remove sharing
    await yulududuCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    const afterRemovalFiches = await yolododoCaller.plans.fiches.listFiches({
      collectiviteId: YOLO_DODO.collectiviteId.admin,
    });

    expect(
      afterRemovalFiches.data.find((f) => f.id === fiche.id)
    ).toBeUndefined();
  });

  test('when a restricted fiche action is shared with another collectivité, it can be read by the other collectivité even if it is restricted', async () => {
    const ficheId = 7;
    const yolododoCaller = router.createCaller({ user: yoloDodoUser });
    const yulududuCaller = router.createCaller({ user: yuluDuduUser });

    // Be sure that the fiche is not shared
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
        restreint: false,
      },
    });
    // Do the same at the end of the test
    onTestFinished(async () => {
      await yolododoCaller.plans.fiches.update({
        ficheId,
        ficheFields: {
          sharedWithCollectivites: [],
          restreint: false,
        },
      });
    });

    // Initially, yuludu should be able to get the fiche
    const initialFiches = await yulududuCaller.plans.fiches.get({
      id: ficheId,
    });
    expect(initialFiches.id).toBe(ficheId);

    // Now we change the fiche to be restricted
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        restreint: true,
      },
    });

    // Can't get the fiche anymore
    await expect(() =>
      yulududuCaller.plans.fiches.get({
        id: ficheId,
      })
    ).toThrowTrpcHttpError(
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${YULU_DUDU.id} n'a pas l'autorisation plans.fiches.lecture sur la ressource Collectivité 1`
      )
    );

    // Share the fiche with collectivité 3
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [{ id: 3 }],
      },
    });

    // Even if the fiche is restricted, collectivité 3 should be able to get it
    const sharedFiche = await yulududuCaller.plans.fiches.get({
      id: ficheId,
    });
    expect(sharedFiche.id).toBe(ficheId);
    expect(sharedFiche?.sharedWithCollectivites).toEqual([
      { id: 3, nom: 'Attignat' },
    ]);
    expect(sharedFiche.restreint).toBe(true);
  });
});
