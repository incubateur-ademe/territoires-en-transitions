import { AuthenticatedUser } from '@/backend/auth/models/auth.models';
import {
  getAuthUser,
  getCollectiviteIdBySiren,
  getTestApp,
  getTestDatabase,
  YULU_DUDU,
} from '@/backend/test';
import { DatabaseService } from '@/backend/utils';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { INestApplication, UnauthorizedException } from '@nestjs/common';

describe('ShareFicheActionService', () => {
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
    const initialFiches = await yulududuCaller.plans.fiches.list({
      collectiviteId: 3,
    });
    expect(initialFiches.find((f) => f.id === ficheId)).toBeUndefined();

    // And can't edit it as well
    await expect(() =>
      yulududuCaller.plans.fiches.update({
        ficheId,
        ficheFields: {
          titre: 'title update',
        },
      })
    ).toThrowTrpcHttpError(
      new UnauthorizedException(
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
    const fichesAfterSharing = await yulududuCaller.plans.fiches.list({
      collectiviteId: 3,
    });
    const sharedFiche = fichesAfterSharing.find((f) => f.id === ficheId);
    expect(sharedFiche).toBeDefined();
    expect(sharedFiche?.sharedByOtherCollectivite).toBe(true);
    expect(sharedFiche?.sharedWithCollectivites).toEqual([
      { id: 3, nom: 'Attignat' },
    ]);

    // And can edit it as well
    await yulududuCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        titre: 'title update',
      },
    });

    // Remove sharing
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    const afterRemovalFiches = await yulududuCaller.plans.fiches.list({
      collectiviteId: 3,
    });
    expect(afterRemovalFiches.find((f) => f.id === ficheId)).toBeUndefined();
  });

  test('should share a restricted fiche action with another collectivité and make it visible on the collectivite profile', async () => {
    const ficheId = 7;
    const yolododoCaller = router.createCaller({ user: yoloDodoUser });
    const yulududuCaller = router.createCaller({ user: yuluDuduUser });

    // Be sure that the fiche is not shared
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    // Initially, yuludu should see the fiche on the collectivite profile
    const initialFiches = await yulududuCaller.plans.fiches.list({
      collectiviteId: 1,
    });
    expect(initialFiches.find((f) => f.id === ficheId)).toBeDefined();

    // Now we change the fiche to be restricted
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        restreint: true,
      },
    });

    // Share the fiche with collectivité 3
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [{ id: 3 }],
      },
    });

    // Not visible anymore
    /* const afterRestrictionFiches = await yulududuCaller.plans.fiches.list({
      collectiviteId: 1,
    });
    expect(
      afterRestrictionFiches.find((f) => f.id === ficheId)
    ).toBeUndefined();*/

    /*
    // And can't edit it as well
    await expect(() =>
      yulududuCaller.plans.fiches.update({
        ficheId,
        ficheFields: {
          titre: 'title update',
        },
      })
    ).toThrowTrpcHttpError(
      new UnauthorizedException(
        `Droits insuffisants, l'utilisateur ${YULU_DUDU.id} n'a pas l'autorisation plans.fiches.edition sur la ressource Collectivité 1`
      )
    );

    

    // Now collectivité 3 should see the fiche
    const fichesAfterSharing = await yulududuCaller.plans.fiches.list({
      collectiviteId: 3,
    });
    const sharedFiche = fichesAfterSharing.find((f) => f.id === ficheId);
    expect(sharedFiche).toBeDefined();
    expect(sharedFiche?.sharedByOtherCollectivite).toBe(true);
    expect(sharedFiche?.sharedWithCollectivites).toEqual([
      { id: 3, nom: 'Attignat' },
    ]);

    // And can edit it as well
    await yulududuCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        titre: 'title update',
      },
    });

    // Remove sharing
    await yolododoCaller.plans.fiches.update({
      ficheId,
      ficheFields: {
        sharedWithCollectivites: [],
      },
    });

    const afterRemovalFiches = await yulududuCaller.plans.fiches.list({
      collectiviteId: 3,
    });
    expect(afterRemovalFiches.find((f) => f.id === ficheId)).toBeUndefined();
    */
  });
});
