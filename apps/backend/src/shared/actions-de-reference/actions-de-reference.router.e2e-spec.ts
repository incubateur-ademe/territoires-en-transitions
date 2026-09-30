import { INestApplication } from '@nestjs/common';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ActionDeReference } from '@tet/domain/shared';
import { inArray } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { actionDeReferenceTable } from './models/action-de-reference.table';

type ActionToInsert = Omit<ActionDeReference, 'id'>;

describe('list-actions', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let userWithoutRole: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);
    const { user } = await addTestUser(db);
    userWithoutRole = getAuthUserFromUserCredentials(user);

    return async () => {
      await app.close();
    };
  });

  const toUniqueActions = (): {
    carpoolingAction: ActionToInsert;
    atticInsulationAction: ActionToInsert;
    searchedTitre: string;
  } => {
    const searchedTitre = `e2e-list-actions-${Date.now()}-${Math.random()}`;
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
  it.todo(
    "modifie l'action pour un super admin et renvoie son id, la valeur en base suit les champs envoyés"
  );
  it.todo("refuse en FORBIDDEN un utilisateur qui n'est pas super admin");
  it.todo("ne modifie pas l'action quand l'utilisateur n'est pas super admin");
  it.todo('refuse en NOT_FOUND un id inconnu');
  it.todo(
    'refuse en CONFLICT un triplet levier, catégorie, titre déjà porté par une autre action'
  );
  it.todo(
    'refuse en BAD_REQUEST un titre ou une description vide, un levier ou une catégorie hors liste'
  );
});

describe('wiring', () => {
  it.todo('expose list et update sous shared.actionsDeReference');
});
