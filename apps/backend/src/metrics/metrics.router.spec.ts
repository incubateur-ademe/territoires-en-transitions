import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';

describe('Route de récupération des métriques', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let testUserId: string;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    const db = await getTestDatabase(app);

    // Collectivité isolée avec un utilisateur admin : aucun autre test ne
    // peut polluer ses compteurs, donc on peut asserter des valeurs exactes.
    const setup = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = setup.collectivite;
    testUser = getAuthUserFromUserCredentials(setup.user);
    testUserId = setup.user.id;

    const caller = router.createCaller({ user: testUser });

    // 2 plans (axes racines) -> plans.count = 2
    await caller.plans.plans.create({
      collectiviteId: collectivite.id,
      nom: 'Plan A',
    });
    await caller.plans.plans.create({
      collectiviteId: collectivite.id,
      nom: 'Plan B',
    });

    // 3 fiches racines + 1 sous-fiche -> plans.fiches = 3 (top-level only)
    const fiche1 = await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Fiche racine 1' },
    });
    await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Fiche racine 2' },
    });
    await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Fiche racine 3' },
    });
    const sousFiche = await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Sous-fiche' },
    });
    await caller.plans.fiches.update({
      ficheId: sousFiche.id,
      ficheFields: { parentId: fiche1.id },
      isNotificationEnabled: false,
    });

    // 2 indicateurs perso dont 1 favori -> favoris = 1, personnalises = 2.
    // create() retourne directement l'id (number).
    const indicateurFavoriId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Indicateur favori',
      estFavori: true,
    });
    const indicateurPiloteId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Indicateur avec pilote',
      estFavori: false,
    });

    // testUser pilote de fiche1 (racine) et de la sous-fiche
    await caller.plans.fiches.update({
      ficheId: fiche1.id,
      ficheFields: {
        pilotes: [{ userId: testUserId }],
        indicateurs: [{ id: indicateurFavoriId }],
      },
      isNotificationEnabled: false,
    });
    await caller.plans.fiches.update({
      ficheId: sousFiche.id,
      ficheFields: { pilotes: [{ userId: testUserId }] },
      isNotificationEnabled: false,
    });

    // testUser pilote de l'indicateur personnalisé indicateurPilote
    await caller.indicateurs.indicateurs.update({
      indicateurId: indicateurPiloteId,
      collectiviteId: collectivite.id,
      indicateurFields: {
        pilotes: [{ userId: testUserId }],
      },
    });

    // testUser pilote d'une mesure du référentiel CAE
    await caller.referentiels.actions.upsertPilotes({
      collectiviteId: collectivite.id,
      mesureId: 'cae_1.1.1.1.1',
      pilotes: [{ userId: testUserId }],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test(`Métriques de la collectivité`, async () => {
    const caller = router.createCaller({ user: testUser });

    const result = await caller.metrics.collectivite({
      collectiviteId: collectivite.id,
    });

    expect(result).toEqual({
      // Pas de labellisation : la collectivité dynamique n'a pas d'audit
      labellisations: {},
      plans: { count: 2, fiches: 3 },
      indicateurs: { favoris: 1, personnalises: 2 },
    });
  });

  test(`Métriques de l'utilisateur`, async () => {
    const caller = router.createCaller({ user: testUser });

    const result = await caller.metrics.personal({
      collectiviteId: collectivite.id,
    });

    expect(result).toEqual({
      plans: {
        piloteFichesCount: 1,
        piloteSubFichesCount: 1,
        piloteFichesIndicateursCount: 1,
      },
      indicateurs: { piloteCount: 1 },
      referentiels: { piloteMesuresCount: 1 },
    });
  });
});
