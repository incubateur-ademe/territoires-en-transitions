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
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { describe, expect, onTestFinished, test } from 'vitest';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';

type Caller = ReturnType<TrpcRouter['createCaller']>;

type ValeursByDate = Record<string, { resultat?: number; objectif?: number }>;

const complete = (valeur: number) => ({ status: 'complete', valeur });
const filledOfTwo = (filledCount: number) => ({
  status: 'incomplete',
  filledCount,
  expectedCount: 2,
});
const hidden = { status: 'hidden' };

describe('Totaux des sous-indicateurs', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    authenticatedUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const createParentWithTwoChildren = async ({
    secondChildIsConfidentiel = false,
    parentIsConfidentiel = false,
    precision,
  }: {
    secondChildIsConfidentiel?: boolean;
    parentIsConfidentiel?: boolean;
    precision?: number;
  } = {}) => {
    const caller = router.createCaller({ user: authenticatedUser });
    const parentId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Déchets ménagers',
      unite: 't',
      estConfidentiel: parentIsConfidentiel,
    });
    if (precision !== undefined) {
      await databaseService.db
        .update(indicateurDefinitionTable)
        .set({ precision })
        .where(eq(indicateurDefinitionTable.id, parentId));
    }
    const firstChildId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Ordures ménagères',
      parentId,
    });
    const secondChildId = await caller.indicateurs.indicateurs.create({
      collectiviteId: collectivite.id,
      titre: 'Tri sélectif',
      parentId,
      estConfidentiel: secondChildIsConfidentiel,
    });
    return { caller, parentId, firstChildId, secondChildId };
  };

  const saveValeurs = ({
    caller,
    indicateurId,
    valeurs,
  }: {
    caller: Caller;
    indicateurId: number;
    valeurs: ValeursByDate;
  }) =>
    Promise.all(
      Object.entries(valeurs).map(([dateValeur, { resultat, objectif }]) =>
        caller.indicateurs.valeurs.upsert({
          collectiviteId: collectivite.id,
          indicateurId,
          dateValeur,
          resultat,
          objectif,
        })
      )
    );

  const saveTwoYears = async (
    options: Parameters<typeof createParentWithTwoChildren>[0]
  ) => {
    const setup = await createParentWithTwoChildren(options);
    await saveValeurs({
      caller: setup.caller,
      indicateurId: setup.firstChildId,
      valeurs: {
        '2022-01-01': { resultat: 1, objectif: 3 },
        '2023-01-01': { resultat: 2, objectif: 4 },
      },
    });
    await saveValeurs({
      caller: setup.caller,
      indicateurId: setup.secondChildId,
      valeurs: {
        '2022-01-01': { resultat: 10, objectif: 30 },
        '2023-01-01': { resultat: 20, objectif: 40 },
      },
    });
    return setup;
  };

  const createVisitorCaller = async () => {
    const other = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    onTestFinished(other.cleanup);
    return router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });
  };

  const getTotals = (caller: Caller, indicateurId: number) =>
    caller.indicateurs.valeurs.totals({
      collectiviteId: collectivite.id,
      indicateurId,
    });

  test('somme les résultats et les objectifs des sous-indicateurs par date pour un membre', async () => {
    const { caller, parentId, firstChildId, secondChildId } =
      await createParentWithTwoChildren();
    await saveValeurs({
      caller,
      indicateurId: firstChildId,
      valeurs: { '2023-01-01': { resultat: 10, objectif: 100 } },
    });
    await saveValeurs({
      caller,
      indicateurId: secondChildId,
      valeurs: { '2023-01-01': { resultat: 5.5, objectif: 50 } },
    });

    await expect(getTotals(caller, parentId)).resolves.toEqual([
      {
        dateValeur: '2023-01-01',
        resultat: complete(15.5),
        objectif: complete(150),
      },
    ]);
  });

  test('indique le nombre de sous-indicateurs renseignés quand il en manque', async () => {
    const { caller, parentId, firstChildId } =
      await createParentWithTwoChildren();
    await saveValeurs({
      caller,
      indicateurId: firstChildId,
      valeurs: { '2023-01-01': { resultat: 10 } },
    });

    await expect(getTotals(caller, parentId)).resolves.toEqual([
      {
        dateValeur: '2023-01-01',
        resultat: filledOfTwo(1),
        objectif: filledOfTwo(0),
      },
    ]);
  });

  test('arrondit le total à la précision du parent après la somme', async () => {
    const { caller, parentId, firstChildId, secondChildId } =
      await createParentWithTwoChildren({ precision: 0 });
    await saveValeurs({
      caller,
      indicateurId: firstChildId,
      valeurs: { '2023-01-01': { resultat: 0.4 } },
    });
    await saveValeurs({
      caller,
      indicateurId: secondChildId,
      valeurs: { '2023-01-01': { resultat: 0.4 } },
    });

    await expect(getTotals(caller, parentId)).resolves.toEqual([
      {
        dateValeur: '2023-01-01',
        resultat: complete(1),
        objectif: filledOfTwo(0),
      },
    ]);
  });

  test('renvoie une liste vide pour un indicateur sans sous-indicateur', async () => {
    const { caller, firstChildId } = await createParentWithTwoChildren();

    await expect(getTotals(caller, firstChildId)).resolves.toEqual([]);
  });

  describe('sous-indicateur confidentiel', () => {
    test('montre au membre les totaux de la date la plus récente', async () => {
      const { caller, parentId } = await saveTwoYears({
        secondChildIsConfidentiel: true,
      });

      await expect(getTotals(caller, parentId)).resolves.toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: complete(11),
          objectif: complete(33),
        },
        {
          dateValeur: '2023-01-01',
          resultat: complete(22),
          objectif: complete(44),
        },
      ]);
    });

    test('masque au visiteur le résultat de la date la plus récente sans masquer l’objectif', async () => {
      const { parentId } = await saveTwoYears({
        secondChildIsConfidentiel: true,
      });
      const visitorCaller = await createVisitorCaller();

      await expect(getTotals(visitorCaller, parentId)).resolves.toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: complete(11),
          objectif: complete(33),
        },
        {
          dateValeur: '2023-01-01',
          resultat: hidden,
          objectif: complete(44),
        },
      ]);
    });
  });

  describe('parent confidentiel', () => {
    test('montre au membre les totaux de la date la plus récente', async () => {
      const { caller, parentId } = await saveTwoYears({
        parentIsConfidentiel: true,
      });

      await expect(getTotals(caller, parentId)).resolves.toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: complete(11),
          objectif: complete(33),
        },
        {
          dateValeur: '2023-01-01',
          resultat: complete(22),
          objectif: complete(44),
        },
      ]);
    });

    test('masque au visiteur le résultat de la date la plus récente sans masquer l’objectif', async () => {
      const { parentId } = await saveTwoYears({ parentIsConfidentiel: true });
      const visitorCaller = await createVisitorCaller();

      await expect(getTotals(visitorCaller, parentId)).resolves.toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: complete(11),
          objectif: complete(33),
        },
        {
          dateValeur: '2023-01-01',
          resultat: hidden,
          objectif: complete(44),
        },
      ]);
    });
  });

  test('refuse un parent qui n’appartient pas à la collectivité', async () => {
    const { caller, parentId } = await createParentWithTwoChildren();
    const other = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    onTestFinished(other.cleanup);
    const otherCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });

    await expect(
      otherCaller.indicateurs.valeurs.totals({
        collectiviteId: other.collectivite.id,
        indicateurId: parentId,
      })
    ).rejects.toThrow(/n'existe pas/);
    await expect(getTotals(caller, parentId)).resolves.toEqual([]);
  });
});
