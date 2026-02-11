import {
  ForbiddenException,
  INestApplication,
  UnprocessableEntityException,
} from '@nestjs/common';
import { VerificationTrajectoireResponseType } from '@tet/backend/indicateurs/trajectoires/verification-trajectoire.response';
import {
  getAuthUser,
  getTestApp,
  getTestRouter,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { VerificationTrajectoireStatus } from '@tet/domain/indicateurs';
import { expect } from 'vitest';

describe('Calcul de trajectoire SNBC', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    yoloDodoUser = await getAuthUser(YOLO_DODO);
  });

  test(`Suppression sans acces`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.delete({
        collectiviteId: 3,
      })
    ).toThrowTrpcHttpError(
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur 17440546-f389-4d4f-bfdb-b0c94a1bd0f9 n'a pas l'autorisation indicateurs.valeurs.mutate sur la ressource Collectivité 3`
      )
    );
  });

  test(`Verification avec une commune`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const statusResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: 1,
      });

    expect(statusResponse).toMatchObject({
      status: VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
    });
  });

  test(`Calcul avec une commune`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.getOrCompute({
        collectiviteId: 1,
      })
    ).toThrowTrpcHttpError(
      new UnprocessableEntityException(
        `Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI.`
      )
    );
  });

  test(`Verification avec donnees manquantes`, async () => {
    const verificationReponseAttendue: VerificationTrajectoireResponseType = {
      status: VerificationTrajectoireStatus.DONNEES_MANQUANTES,
      epci: {
        type: 'epci',
        id: 3812,
        nom: 'CA du Bassin de Bourg-en-Bresse',
        siren: '200071751',
        natureInsee: 'CA',
        activeCOT: false,
      },
      donneesEntree: {
        sources: [],
        emissionsGes: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_1.c'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.d'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.i'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.g'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.f'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.h'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.j'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_1.c',
            'cae_1.d',
            'cae_1.i',
            'cae_1.g',
            'cae_1.e',
            'cae_1.f',
            'cae_1.h',
            'cae_1.j',
          ],
        },
        consommationsFinales: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_2.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.f'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.k'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.i'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.g', 'cae_2.h'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.j'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.l_pcaet'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_2.e',
            'cae_2.f',
            'cae_2.k',
            'cae_2.i',
            'cae_2.g',
            'cae_2.h',
            'cae_2.j',
            'cae_2.l_pcaet',
          ],
        },
        sequestrations: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_63.ca'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cb'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.da'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cd'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cc'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.db'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.b'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_63.ca',
            'cae_63.cb',
            'cae_63.da',
            'cae_63.cd',
            'cae_63.cc',
            'cae_63.db',
            'cae_63.b',
            'cae_63.e',
          ],
        },
        lastModifiedAt: null,
      },
    };

    const caller = router.createCaller({ user: yoloDodoUser });

    const statusResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: 3812,
        epciInfo: true,
      });
    expect(statusResponse).toMatchObject(verificationReponseAttendue);
  });

  test(`Calcul avec donnees manquantes`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.getOrCompute({
        collectiviteId: 3812,
      })
    ).toThrowTrpcHttpError(
      new UnprocessableEntityException(
        `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : cae_1.c, cae_1.d, cae_1.i, cae_1.g, cae_1.e, cae_1.f, cae_1.h, cae_1.j, cae_2.e, cae_2.f, cae_2.k, cae_2.i, cae_2.g, cae_2.h, cae_2.j, cae_2.l_pcaet, impossible de calculer la trajectoire SNBC.`
      )
    );
  }, 10000);

  test(`Calcul/récupération avec droit suffisant - visite`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const trajectoire = await caller.indicateurs.trajectoires.snbc.getOrCompute(
      {
        collectiviteId: 3895,
      }
    );
    expect(trajectoire).toBeDefined();
  }, 30000);

  test(`Calcul/récupération avec droit suffisant - lecture`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const trajectoire = await caller.indicateurs.trajectoires.snbc.getOrCompute(
      {
        collectiviteId: 3895,
      }
    );
    expect(trajectoire).toBeDefined();
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 30000);
});
