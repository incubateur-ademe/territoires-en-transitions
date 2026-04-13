import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { ficheActionEtapeTable } from './fiche-action-etape.table';

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
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testUserResult = await addTestUser(databaseService, {
      collectiviteId: 1,
      role: CollectiviteRole.ADMIN,
    });
    authenticatedUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  test(`Test la gestion de l'ordre des étapes d'une fiche action`, async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const ficheId: listInput = {
      ficheId: 1,
    };

    onTestFinished(async () => {
      try {
        await databaseService.db
          .delete(ficheActionEtapeTable)
          .where(eq(ficheActionEtapeTable.ficheId, 1));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });

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

    const upsertA = await caller.plans.fiches.etapes.upsert(etapeA);
    expect(upsertA.id).not.toBeNull();
    const upsertB = await caller.plans.fiches.etapes.upsert(etapeB);
    expect(upsertB.id).not.toBeNull();
    let ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(2);
    expect(ordre[0].nom).toBe('A');
    expect(ordre[0].ordre).toBe(1);
    expect(ordre[1].nom).toBe('B');
    expect(ordre[1].ordre).toBe(2);
    const upsertC = await caller.plans.fiches.etapes.upsert(etapeC);
    expect(upsertC.id).not.toBeNull();
    expect(upsertC.realise).toBe(false);
    ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(3);
    expect(ordre[0].nom).toBe('A');
    expect(ordre[0].ordre).toBe(1);
    expect(ordre[1].nom).toBe('C');
    expect(ordre[1].ordre).toBe(2);
    expect(ordre[2].nom).toBe('B');
    expect(ordre[2].ordre).toBe(3);
    const updatedEtapeC = upsertC;
    upsertC.ordre = 3;
    upsertC.realise = true;
    await caller.plans.fiches.etapes.upsert(updatedEtapeC);
    ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(3);
    expect(ordre[0].nom).toBe('A');
    expect(ordre[0].ordre).toBe(1);
    expect(ordre[1].nom).toBe('B');
    expect(ordre[1].ordre).toBe(2);
    expect(ordre[2].nom).toBe('C');
    expect(ordre[2].ordre).toBe(3);
    expect(ordre[2].realise).toBe(true);
    await caller.plans.fiches.etapes.delete({
      etapeId: upsertB.id,
    } as deleteInput);
    ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(2);
    expect(ordre[0].nom).toBe('A');
    expect(ordre[0].ordre).toBe(1);
    expect(ordre[1].nom).toBe('C');
    expect(ordre[1].ordre).toBe(2);
    await caller.plans.fiches.etapes.delete({
      etapeId: upsertA.id,
    } as deleteInput);
    ordre = await caller.plans.fiches.etapes.list(ficheId);
    expect(ordre.length).toBe(1);
    expect(ordre[0].nom).toBe('C');
    expect(ordre[0].ordre).toBe(1);
  });
});
