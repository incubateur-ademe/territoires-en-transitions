import { INestApplication } from '@nestjs/common';
import { getAuthUser, getTestApp, YOULOU_DOUDOU } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import {
  getAuthUserFromUserCredentials,
  getTestDatabase,
} from '@tet/backend/test';

describe('Route de récupération des métriques', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let youlouDoudouUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    const db = await getTestDatabase(app);

    // Utilisateur isolé admin sur collectiviteId 1
    const testUser1Result = await addTestUser(db, {
      collectiviteId: 1,
      role: CollectiviteRole.ADMIN,
    });
    yoloDodoUser = getAuthUserFromUserCredentials(testUser1Result.user);

    // YOULOU_DOUDOU est un utilisateur seed avec rôle auditeur sur collectiviteId 10
    // Nécessaire pour valider l'audit dans le test de métriques
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
          etoiles: expect.any(Number),
        },
      },
      plans: { count: expect.any(Number), fiches: expect.any(Number) },
      indicateurs: { favoris: expect.any(Number), personnalises: expect.any(Number) },
    });
  });

  test(`Métriques de l'utilisateur`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const result = await caller.metrics.personal({
      collectiviteId: 1,
    });

    // Un utilisateur de test isolé n'est pilote d'aucune fiche/indicateur/mesure
    expect(result).toMatchObject({
      plans: {
        piloteFichesCount: expect.any(Number),
        piloteFichesIndicateursCount: expect.any(Number),
      },
      indicateurs: { piloteCount: expect.any(Number) },
      referentiels: { piloteMesuresCount: expect.any(Number) },
    });
  });
});
