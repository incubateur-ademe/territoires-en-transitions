import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';

type upsertInput = inferProcedureInput<
  AppRouter['plans']['fiches']['etapes']['upsert']
>;
type deleteInput = inferProcedureInput<
  AppRouter['plans']['fiches']['etapes']['delete']
>;
type listInput = inferProcedureInput<
  AppRouter['plans']['fiches']['etapes']['list']
>;

describe('Route CRUD des étapes des fiches actions', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const databaseService = await getTestDatabase(app);

    const { collectivite: testCollectivite, user } =
      await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
    collectivite = testCollectivite;
    authenticatedUser = getAuthUserFromUserCredentials(user);
  });

  afterAll(async () => {
    await app.close();
  });

  test(`Test la gestion de l'ordre des étapes d'une fiche action`, async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const ficheIdValue = await createFiche({
      caller,
      ficheInput: {
        titre: 'Fiche test étapes',
        collectiviteId: collectivite.id,
      },
    });
    const ficheId: listInput = {
      ficheId: ficheIdValue,
    };

    const etapeA: upsertInput = {
      ficheId: ficheId.ficheId,
      nom: 'A',
      ordre: 1,
    };
    const etapeB: upsertInput = {
      ficheId: ficheId.ficheId,
      nom: 'B',
      ordre: 2,
    };
    const etapeC: upsertInput = {
      ficheId: ficheId.ficheId,
      nom: 'C',
      ordre: 2,
    };

    // Ajout de deux étapes A et B
    const upsertA = await caller.plans.fiches.etapes.upsert(etapeA);
    expect(upsertA.id).not.toBeNull();
    const upsertB = await caller.plans.fiches.etapes.upsert(etapeB);
    expect(upsertB.id).not.toBeNull();
    // Vérifie que l'ordre est A=1, B=2
    let ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(2);
    expect(ordre[0].nom).toBe('A');
    expect(ordre[0].ordre).toBe(1);
    expect(ordre[1].nom).toBe('B');
    expect(ordre[1].ordre).toBe(2);
    // Ajout d'une étape C entre A et B
    const upsertC = await caller.plans.fiches.etapes.upsert(etapeC);
    expect(upsertC.id).not.toBeNull();
    expect(upsertC.realise).toBe(false);
    // Vérifie que l'ordre est A=1, C=2, B=3
    ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(3);
    expect(ordre[0].nom).toBe('A');
    expect(ordre[0].ordre).toBe(1);
    expect(ordre[1].nom).toBe('C');
    expect(ordre[1].ordre).toBe(2);
    expect(ordre[2].nom).toBe('B');
    expect(ordre[2].ordre).toBe(3);
    // Déplace l'étape C vers la troisième position et passe réalisé à true
    const updatedEtapeC = upsertC;
    upsertC.ordre = 3;
    upsertC.realise = true;
    await caller.plans.fiches.etapes.upsert(updatedEtapeC);
    // Vérifie que l'ordre est A=1, B=2, C=3
    ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(3);
    expect(ordre[0].nom).toBe('A');
    expect(ordre[0].ordre).toBe(1);
    expect(ordre[1].nom).toBe('B');
    expect(ordre[1].ordre).toBe(2);
    expect(ordre[2].nom).toBe('C');
    expect(ordre[2].ordre).toBe(3);
    // Vérifie que réalisé a bien été modifié
    expect(ordre[2].realise).toBe(true);
    // Supprime l'étape B
    await caller.plans.fiches.etapes.delete({
      etapeId: upsertB.id,
    } as deleteInput);
    // Vérifie que l'ordre est A=1, C=2
    ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(2);
    expect(ordre[0].nom).toBe('A');
    expect(ordre[0].ordre).toBe(1);
    expect(ordre[1].nom).toBe('C');
    expect(ordre[1].ordre).toBe(2);
    // Supprime l'étape A
    await caller.plans.fiches.etapes.delete({
      etapeId: upsertA.id,
    } as deleteInput);
    // Vérifie que l'ordre est C=1
    ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(1);
    expect(ordre[0].nom).toBe('C');
    expect(ordre[0].ordre).toBe(1);
  });
});
