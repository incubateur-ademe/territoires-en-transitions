import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { EtoileEnum, ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { seedLabellisationObtenue } from './labellisations.test-fixture';

describe('getParcours : étoile visée', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectivite: Collectivite;
  let adminUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUser = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testCollectiviteAndUser.collectivite;
    adminUser = getAuthUserFromUserCredentials(testCollectiviteAndUser.user);

    await seedLabellisationObtenue({
      databaseService: db,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.ECI,
      etoiles: EtoileEnum.TROISIEME_ETOILE,
    });

    return async () => {
      await app.close();
    };
  });

  test('sans étoile visée, une collectivité labellisée 3 étoiles est évaluée sur les critères de la 4e : la mesure réglementaire eci_2.1.0 doit être Faite', async () => {
    const caller = router.createCaller({ user: adminUser });

    const parcours = await caller.referentiels.labellisations.getParcours({
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.ECI,
    });

    expect({
      etoiles: parcours.etoiles,
      scoreARealiser: parcours.critereScore.scoreARealiser,
      critereReglementaire: parcours.criteresAction.find(
        (critere) => critere.actionId === 'eci_2.1.0'
      ),
    }).toMatchObject({
      etoiles: EtoileEnum.QUATRIEME_ETOILE,
      scoreARealiser: 0.65,
      critereReglementaire: {
        etoile: EtoileEnum.QUATRIEME_ETOILE,
        minRealisePercentage: 100,
        minProgrammePercentage: null,
      },
    });
  });

  test('en visant la 3e étoile, la même collectivité est évaluée sur les critères de la 3e : eci_2.1.0 accepte le statut Programmé', async () => {
    const caller = router.createCaller({ user: adminUser });

    const parcours = await caller.referentiels.labellisations.getParcours({
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.ECI,
      etoileVisee: EtoileEnum.TROISIEME_ETOILE,
    });

    expect({
      etoiles: parcours.etoiles,
      scoreARealiser: parcours.critereScore.scoreARealiser,
      critereReglementaire: parcours.criteresAction.find(
        (critere) => critere.actionId === 'eci_2.1.0'
      ),
    }).toMatchObject({
      etoiles: EtoileEnum.TROISIEME_ETOILE,
      scoreARealiser: 0.5,
      critereReglementaire: {
        etoile: EtoileEnum.PREMIERE_ETOILE,
        minRealisePercentage: 100,
        minProgrammePercentage: 100,
      },
    });
  });
});
