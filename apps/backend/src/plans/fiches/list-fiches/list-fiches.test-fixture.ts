import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthUserFromUserCredentials } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PersonneId, TagEnum } from '@tet/domain/collectivites';
import { ListFichesRequestFilters } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { inferRouterInputs } from '@trpc/server';
import { createFicheAndCleanupFunction } from '../fiches.test-fixture';

type ListFichesInput =
  inferRouterInputs<AppRouter>['plans']['fiches']['listFiches'];

type AxeRef = { id: number; planId: number };
type FicheRef = { id: number; titre: string };
type CreateFicheFields =
  inferRouterInputs<AppRouter>['plans']['fiches']['create']['fiche'];
type FicheOptions = {
  axes?: AxeRef[];
  pilotes?: PersonneId[];
  /** champs de la fiche, posés à la création */
  champs?: Partial<
    Pick<
      CreateFicheFields,
      'statut' | 'description' | 'dateFin' | 'priorite' | 'restreint'
    >
  >;
};

/**
 * Collectivité neuve, avec un admin, pour écrire un scénario de listFiches
 * en quelques lignes : les fiches listées sont exactement celles que le test a
 * créées. Tout passe par l'API.
 *
 * Pas de nettoyage : la collectivité n'est utilisée que par le test.
 */
export async function createListFichesScenario({
  router,
  db,
}: {
  router: TrpcRouter;
  db: DatabaseService;
}) {
  const { collectivite } = await addTestCollectivite(db);
  const collectiviteId = collectivite.id;
  const { user } = await addTestUser(db, {
    collectiviteId,
    role: CollectiviteRole.ADMIN,
  });
  const admin: AuthenticatedUser = getAuthUserFromUserCredentials(user);
  const caller = router.createCaller({ user: admin });

  const createPlan = async (nom: string): Promise<AxeRef> => {
    const plan = await caller.plans.plans.create({ nom, collectiviteId });
    return { id: plan.id, planId: plan.id };
  };

  const createAxe = async (nom: string, parent: AxeRef): Promise<AxeRef> => {
    const axe = await caller.plans.axes.create({
      nom,
      collectiviteId,
      planId: parent.planId,
      parent: parent.id,
    });
    return { id: axe.id, planId: parent.planId };
  };

  const createPersonnePilote = async (
    nom: string
  ): Promise<{ tagId: number }> => {
    const tag = await caller.collectivites.tags.create({
      tagType: TagEnum.Personne,
      nom,
      collectiviteId,
    });
    return { tagId: tag.id };
  };

  const createFiche = async (
    titre: string,
    { axes, pilotes, champs, parentId }: FicheOptions & { parentId?: number }
  ): Promise<FicheRef> => {
    const { ficheId } = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { ...champs, titre, collectiviteId, parentId, pilotes },
    });
    if (axes?.length) {
      await caller.plans.fiches.update({
        ficheId,
        ficheFields: { axes: axes.map(({ id }) => ({ id })) },
      });
    }
    return { id: ficheId, titre };
  };

  return {
    collectiviteId,
    admin,
    /** l'admin, en tant que pilote */
    adminPilote: { userId: admin.id } satisfies PersonneId,
    createPlan,
    createAxe,
    createPersonnePilote,

    createAction: (titre: string, options: FicheOptions = {}) =>
      createFiche(titre, options),

    createSousAction: (
      parent: FicheRef,
      titre: string,
      options: FicheOptions = {}
    ) => createFiche(titre, { ...options, parentId: parent.id }),

    /** suppression douce, qui emporte aussi les sous-actions existantes */
    deleteFiche: async (fiche: FicheRef) => {
      await caller.plans.fiches.delete({
        ficheId: fiche.id,
        deleteMode: 'soft',
      });
    },

    listFiches: (
      filters: ListFichesRequestFilters,
      queryOptions?: ListFichesInput['queryOptions']
    ) =>
      caller.plans.fiches.listFiches({ collectiviteId, filters, queryOptions }),

    /** titres des fiches listées, triés par ordre alphabétique */
    listTitres: async (
      filters: ListFichesRequestFilters
    ): Promise<string[]> => {
      const { data } = await caller.plans.fiches.listFiches({
        collectiviteId,
        filters,
      });
      return data.map((fiche) => fiche.titre ?? '').sort();
    },

    getFiche: (fiche: FicheRef) => caller.plans.fiches.get({ id: fiche.id }),

    countSousActionsMatches: (filters: ListFichesRequestFilters) =>
      caller.plans.fiches.countSousActionsMatches({ collectiviteId, filters }),
  };
}
