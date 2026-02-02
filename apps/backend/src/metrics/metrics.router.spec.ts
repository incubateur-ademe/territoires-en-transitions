import { INestApplication } from '@nestjs/common';
import { getAuthUser, getTestApp, YOULOU_DOUDOU } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';

describe('Route de récupération des métriques', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let youlouDoudouUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser();
    youlouDoudouUser = await getAuthUser(YOULOU_DOUDOU);
  });

  test(`Métriques de la collectivité`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const parcours = await caller.referentiels.labellisations.getParcours({
      collectiviteId: 1,
      referentielId: 'cae',
    });

    // Finalise l'audit si nécessaire
    if (
      parcours.audit?.id &&
      (!parcours.audit?.valide || !parcours.audit?.date_fin)
    ) {
      const auditeurCaller = router.createCaller({
        user: youlouDoudouUser,
      });

      if (!parcours.audit.date_debut) {
        await auditeurCaller.referentiels.labellisations.startAudit({
          auditId: parcours.audit.id,
        });
      }

      await auditeurCaller.referentiels.labellisations.validateAudit({
        auditId: parcours.audit.id,
      });
    }

    const result = await caller.metrics.collectivite({
      collectiviteId: 1,
    });

    expect(result).toMatchObject({
      labellisations: {
        cae: {
          etoiles: 1,
        },
      },
      plans: { count: 2, fiches: 13 },
      indicateurs: { favoris: 0, personnalises: 1 },
    });
  });

  test(`Métriques de l'utilisateur`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const result = await caller.metrics.personal({
      collectiviteId: 1,
    });

    expect(result).toMatchObject({
      plans: {
        count: 2,
        piloteFichesCount: 1,
        piloteFichesIndicateursCount: 0,
      },
      indicateurs: { piloteCount: 0 },
      referentiels: { piloteMesuresCount: 0 },
    });
  });
});
