import { INestApplication } from '@nestjs/common';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  ActionDeReference,
  ActionDeReferenceId,
  actionDeReferenceIdSchema,
} from '@tet/domain/shared';
import { eq, inArray } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { actionDeReferenceTable } from './models/action-de-reference.table';

type ActionToInsert = Omit<ActionDeReference, 'id'>;

let app: INestApplication;
let router: TrpcRouter;
let db: DatabaseService;
let userWithoutRole: AuthenticatedUser;
let superAdmin: AuthenticatedUser;

beforeAll(async () => {
  app = await getTestApp();
  router = await getTestRouter(app);
  db = await getTestDatabase(app);

  const { user } = await addTestUser(db);
  userWithoutRole = getAuthUserFromUserCredentials(user);

  const { user: superAdminCredentials } = await addTestUser(db);
  superAdmin = getAuthUserFromUserCredentials(superAdminCredentials);
  const { cleanup: cleanupSuperAdminMode } =
    await addAndEnableUserSuperAdminMode({
      app,
      caller: router.createCaller({ user: superAdmin }),
      userId: superAdmin.id,
    });

  return async () => {
    await cleanupSuperAdminMode();
    await app.close();
  };
});

const toUniqueActions = (): {
  carpoolingAction: ActionToInsert;
  atticInsulationAction: ActionToInsert;
  searchedTitre: string;
} => {
  const searchedTitre = `e2e-actions-de-reference-${Date.now()}-${Math.random()}`;
  return {
    searchedTitre,
    carpoolingAction: {
      titre: `Organiser le covoiturage ${searchedTitre}`,
      description: "Mettre en relation les salariés des zones d'activité",
      levier: 'covoiturage',
      categorie: 'gouvernance',
    },
    atticInsulationAction: {
      titre: `Isoler les combles ${searchedTitre}`,
      description: 'Réduire les pertes de chaleur par la toiture',
      levier: 'sobriete_batiments_residentiel',
      categorie: 'amenagement',
    },
  };
};

const insertActions = async (
  actions: readonly ActionToInsert[]
): Promise<ActionDeReference[]> => {
  const insertedActions = await db.db
    .insert(actionDeReferenceTable)
    .values([...actions])
    .returning();
  onTestFinished(async () => {
    await db.db.delete(actionDeReferenceTable).where(
      inArray(
        actionDeReferenceTable.id,
        insertedActions.map((action) => action.id)
      )
    );
  });
  return insertedActions;
};

const readStoredAction = async (
  id: ActionDeReferenceId
): Promise<ActionDeReference[]> =>
  db.db
    .select()
    .from(actionDeReferenceTable)
    .where(eq(actionDeReferenceTable.id, id));

describe('list-actions', () => {
  it('renvoie les actions filtrées à un utilisateur connecté sans rôle', async () => {
    const { carpoolingAction, atticInsulationAction, searchedTitre } =
      toUniqueActions();
    const [insertedCarpoolingAction] = await insertActions([
      carpoolingAction,
      atticInsulationAction,
    ]);
    const caller = router.createCaller({ user: userWithoutRole });

    expect(
      await caller.shared.actionsDeReference.list({
        titre: searchedTitre,
        leviers: ['covoiturage'],
      })
    ).toEqual([insertedCarpoolingAction]);
  });

  it('refuse un appel sans utilisateur connecté', async () => {
    const caller = router.createCaller({ user: null });

    await expect(caller.shared.actionsDeReference.list({})).rejects.toThrow(
      expect.objectContaining({ code: 'UNAUTHORIZED' })
    );
  });

  it('refuse en BAD_REQUEST un levier ou une catégorie hors liste', async () => {
    const caller = router.createCaller({ user: userWithoutRole });

    await expect(
      caller.shared.actionsDeReference.list({
        // @ts-expect-error levier hors liste envoyé exprès
        leviers: ['levier_inconnu'],
      })
    ).rejects.toThrow(expect.objectContaining({ code: 'BAD_REQUEST' }));
    await expect(
      caller.shared.actionsDeReference.list({
        // @ts-expect-error catégorie hors liste envoyée exprès
        categories: ['categorie_inconnue'],
      })
    ).rejects.toThrow(expect.objectContaining({ code: 'BAD_REQUEST' }));
  });

  it("ne filtre pas sur le titre ni sur la description quand le texte cherché n'est fait que d'espaces", async () => {
    const { carpoolingAction, atticInsulationAction } = toUniqueActions();
    const insertedActions = await insertActions([
      carpoolingAction,
      atticInsulationAction,
    ]);
    const caller = router.createCaller({ user: userWithoutRole });

    const withBlankSearchedText = await caller.shared.actionsDeReference.list({
      titre: '   ',
      description: ' \t ',
    });
    const withoutFilter = await caller.shared.actionsDeReference.list({});

    expect(withBlankSearchedText).toEqual(withoutFilter);
    expect(withBlankSearchedText).toEqual(
      expect.arrayContaining(insertedActions)
    );
  });

  it('renvoie toutes les actions quand les listes de leviers et de catégories envoyées sont vides', async () => {
    const { carpoolingAction, atticInsulationAction } = toUniqueActions();
    const insertedActions = await insertActions([
      carpoolingAction,
      atticInsulationAction,
    ]);
    const caller = router.createCaller({ user: userWithoutRole });

    const withEmptyLists = await caller.shared.actionsDeReference.list({
      leviers: [],
      categories: [],
    });
    const withoutFilter = await caller.shared.actionsDeReference.list({});

    expect(withEmptyLists).toEqual(withoutFilter);
    expect(withEmptyLists).toEqual(expect.arrayContaining(insertedActions));
  });
});

describe('update-action', () => {
  const unknownActionDeReferenceId =
    actionDeReferenceIdSchema.parse(2147483647);

  it("modifie l'action pour un super admin et renvoie son id, la valeur en base suit les champs envoyés", async () => {
    const { carpoolingAction, searchedTitre } = toUniqueActions();
    const [insertedAction] = await insertActions([carpoolingAction]);
    const changes = {
      titre: `Développer l'autopartage ${searchedTitre}`,
      description: 'Mettre des véhicules partagés à disposition',
      levier: 'sobriete_batiments_residentiel',
      categorie: 'financement',
    } satisfies ActionToInsert;
    const caller = router.createCaller({ user: superAdmin });

    expect({
      updateOutput: await caller.shared.actionsDeReference.update({
        id: insertedAction.id,
        ...changes,
      }),
      storedAction: await readStoredAction(insertedAction.id),
    }).toEqual({
      updateOutput: { id: insertedAction.id },
      storedAction: [{ id: insertedAction.id, ...changes }],
    });
  });

  it("renvoie l'id sans rien modifier quand seul l'id est envoyé", async () => {
    const { carpoolingAction } = toUniqueActions();
    const [insertedAction] = await insertActions([carpoolingAction]);
    const caller = router.createCaller({ user: superAdmin });

    expect({
      updateOutput: await caller.shared.actionsDeReference.update({
        id: insertedAction.id,
      }),
      storedAction: await readStoredAction(insertedAction.id),
    }).toEqual({
      updateOutput: { id: insertedAction.id },
      storedAction: [insertedAction],
    });
  });

  it("refuse en FORBIDDEN un utilisateur qui n'est pas super admin", async () => {
    const { carpoolingAction } = toUniqueActions();
    const [insertedAction] = await insertActions([carpoolingAction]);
    const caller = router.createCaller({ user: userWithoutRole });

    await expect(
      caller.shared.actionsDeReference.update({
        id: insertedAction.id,
        titre: 'Développer le covoiturage',
      })
    ).rejects.toThrow(expect.objectContaining({ code: 'FORBIDDEN' }));
  });

  it("ne modifie pas l'action quand l'utilisateur n'est pas super admin", async () => {
    const { carpoolingAction } = toUniqueActions();
    const [insertedAction] = await insertActions([carpoolingAction]);
    const caller = router.createCaller({ user: userWithoutRole });

    await expect(
      caller.shared.actionsDeReference.update({
        id: insertedAction.id,
        titre: 'Développer le covoiturage',
      })
    ).rejects.toThrow(expect.objectContaining({ code: 'FORBIDDEN' }));

    expect(await readStoredAction(insertedAction.id)).toEqual([insertedAction]);
  });

  it('refuse en NOT_FOUND un id inconnu', async () => {
    const caller = router.createCaller({ user: superAdmin });

    await expect(
      caller.shared.actionsDeReference.update({
        id: unknownActionDeReferenceId,
        titre: 'Développer le covoiturage',
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'NOT_FOUND',
        message: "L'action de référence demandée n'existe pas",
      })
    );
  });

  it('refuse en CONFLICT un triplet levier, catégorie, titre déjà porté par une autre action', async () => {
    const { carpoolingAction, atticInsulationAction } = toUniqueActions();
    const [, insertedAtticInsulationAction] = await insertActions([
      carpoolingAction,
      atticInsulationAction,
    ]);
    const caller = router.createCaller({ user: superAdmin });

    await expect(
      caller.shared.actionsDeReference.update({
        id: insertedAtticInsulationAction.id,
        titre: carpoolingAction.titre,
        levier: carpoolingAction.levier,
        categorie: carpoolingAction.categorie,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'CONFLICT',
        message:
          'Une action de référence porte déjà ce titre pour ce levier et cette catégorie',
      })
    );
    expect(await readStoredAction(insertedAtticInsulationAction.id)).toEqual([
      insertedAtticInsulationAction,
    ]);
  });

  it('refuse en BAD_REQUEST un titre ou une description vide, un levier ou une catégorie hors liste', async () => {
    const { carpoolingAction } = toUniqueActions();
    const [insertedAction] = await insertActions([carpoolingAction]);
    const caller = router.createCaller({ user: superAdmin });
    const badRequest = expect.objectContaining({ code: 'BAD_REQUEST' });

    await expect(
      caller.shared.actionsDeReference.update({
        id: insertedAction.id,
        titre: '   ',
      })
    ).rejects.toThrow(badRequest);
    await expect(
      caller.shared.actionsDeReference.update({
        id: insertedAction.id,
        description: '',
      })
    ).rejects.toThrow(badRequest);
    await expect(
      caller.shared.actionsDeReference.update({
        id: insertedAction.id,
        // @ts-expect-error levier hors liste envoyé exprès
        levier: 'levier_inconnu',
      })
    ).rejects.toThrow(badRequest);
    await expect(
      caller.shared.actionsDeReference.update({
        id: insertedAction.id,
        // @ts-expect-error catégorie hors liste envoyée exprès
        categorie: 'categorie_inconnue',
      })
    ).rejects.toThrow(badRequest);
    expect(await readStoredAction(insertedAction.id)).toEqual([insertedAction]);
  });
});

describe('wiring', () => {
  it('expose list et update sous shared.actionsDeReference', () => {
    const actionsDeReferencePaths = Object.keys(
      router.appRouter._def.procedures
    ).filter((path) => path.startsWith('shared.actionsDeReference.'));
    const { list, update } = router.appRouter.shared.actionsDeReference;

    expect({
      actionsDeReferencePaths,
      listType: list._def.type,
      updateType: update._def.type,
    }).toEqual({
      actionsDeReferencePaths: [
        'shared.actionsDeReference.list',
        'shared.actionsDeReference.update',
      ],
      listType: 'query',
      updateType: 'mutation',
    });
  });
});
