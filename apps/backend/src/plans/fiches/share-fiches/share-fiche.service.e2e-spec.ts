import {
  getAuthUser,
  getCollectiviteIdBySiren,
  getTestApp,
  getTestDatabase,
  YULU_DUDU,
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
  let paysDuLaonCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser();
    databaseService = await getTestDatabase(app);
    paysDuLaonCollectiviteId = await getCollectiviteIdBySiren(
      databaseService,
      '200043495'
    );
    yuluDuduUser = await getAuthUser(YULU_DUDU);
  });

  test('should share a fiche action with another collectivité and make it visible / editable', async () => {
    const ficheId = 6;
    const yolododoCaller = router.createCaller({ user: yoloDodoUser });
    const yulududuCaller = router.createCaller({ user: yuluDuduUser });

    // Be sure that the fiche is not shared
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    // Initially, collectivité 3 should not see the fiche
    const initialFiches = await yulududuCaller.plans.fiches.listResumes({
      collectiviteId: 3,
    });
    expect(initialFiches.data.find((f) => f.id === ficheId)).toBeUndefined();

    // And can't edit it as well
    await expect(() =>
      yulududuCaller.plans.fiches.update({
        ficheId,
        ficheFields: {
          titre: 'title update',
        },
      })
    ).toThrowTrpcHttpError(
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${YULU_DUDU.id} n'a pas l'autorisation plans.fiches.edition sur la ressource Collectivité 1`
      )
    );

    // Share the fiche with collectivité 3
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [{ id: 3 }],
      },
    });

    // Now collectivité 3 should see the fiche
    const fichesAfterSharing = await yulududuCaller.plans.fiches.listResumes({
      collectiviteId: 3,
    });
    const sharedFiche = fichesAfterSharing.data.find((f) => f.id === ficheId);
    expect(sharedFiche).toBeDefined();
    expect(sharedFiche?.sharedWithCollectivites).toEqual([
      { id: 3, nom: 'Attignat' },
    ]);

    // And can edit it as well
    const updatedFiche = await yulududuCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        titre: 'title update',
      },
    });
    expect(updatedFiche.titre).toBe('title update');

    // Can also do a bulk edit with the fiche
    await yulududuCaller.plans.fiches.bulkEdit({
      ficheIds: [ficheId],
      statut: 'Bloqué',
    });
    const ficheAfterBulkUpdate = await yulududuCaller.plans.fiches.get({
      id: ficheId,
    });
    expect(ficheAfterBulkUpdate.statut).toEqual('Bloqué');

    // Restore title & statut
    await yulududuCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        titre: sharedFiche?.titre,
        statut: sharedFiche?.statut,
      },
    });

    // Remove sharing
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    const afterRemovalFiches = await yulududuCaller.plans.fiches.listResumes({
      collectiviteId: 3,
    });
    expect(
      afterRemovalFiches.data.find((f) => f.id === ficheId)
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
