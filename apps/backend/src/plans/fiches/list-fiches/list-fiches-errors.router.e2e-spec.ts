import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { INestApplication } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { ListFichesFiltersRepository } from './list-fiches-filters.repository';
import { createListFichesScenario } from './list-fiches.test-fixture';

/**
 * Chemins d'erreur du router : le service renvoie un Result, que le router
 * traduit en TRPCError avec `listFichesErrorConfig`.
 */
describe('listFiches : chemins d’erreur', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  const catchTrpcError = async (call: () => Promise<unknown>) => {
    try {
      await call();
    } catch (error) {
      if (error instanceof TRPCError) return error;
      throw error;
    }
    throw new Error('L’appel aurait dû échouer');
  };

  test('get sur une fiche inexistante : NOT_FOUND, avec l’id dans le message', async () => {
    const s = await createListFichesScenario({ router, db });
    const caller = router.createCaller({ user: s.admin });

    const error = await catchTrpcError(() =>
      caller.plans.fiches.get({ id: 999_999_999 })
    );

    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe("Aucune action trouvée avec l'id 999999999");
  });

  test('get sur une fiche restreinte d’une autre collectivité : FORBIDDEN, avec l’autorisation manquante', async () => {
    const s = await createListFichesScenario({ router, db });
    const fiche = await s.createAction('Fiche restreinte');
    await router.createCaller({ user: s.admin }).plans.fiches.update({
      ficheId: fiche.id,
      ficheFields: { restreint: true },
    });

    const { collectivite: autreCollectivite } = await addTestCollectivite(db);
    const { user } = await addTestUser(db, {
      collectiviteId: autreCollectivite.id,
      role: CollectiviteRole.ADMIN,
    });
    const visiteur = getAuthUserFromUserCredentials(user);

    const error = await catchTrpcError(() =>
      router.createCaller({ user: visiteur }).plans.fiches.get({ id: fiche.id })
    );

    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toMatch(
      new RegExp(
        `^Droits insuffisants, l'utilisateur ${visiteur.id} n'a pas l'autorisation plans\\.fiches\\.read_confidentiel`
      )
    );
  });

  // Le détail de la panne reste dans la cause : l'errorFormatter tRPC le
  // recopie dans `data.errorKey` (expurgé), comme pour toute erreur non HTTP.
  test('listFiches sur une panne de la requête : INTERNAL_SERVER_ERROR avec un message générique', async () => {
    const s = await createListFichesScenario({ router, db });
    vi.spyOn(
      app.get(ListFichesFiltersRepository),
      'getConditions'
    ).mockImplementationOnce(() => {
      throw new Error('détail interne de la panne');
    });

    const error = await catchTrpcError(() => s.listFiches({}));

    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.message).toBe("Une erreur de base de données s'est produite");
    expect(error.cause?.message).toBe('détail interne de la panne');
  });
});
