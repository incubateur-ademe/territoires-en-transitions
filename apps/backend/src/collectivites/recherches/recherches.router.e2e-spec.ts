import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { servicesDeconcentresTypes } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { labellisationTable } from '@tet/backend/referentiels/labellisations/labellisation.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { SQL_CURRENT_TIMESTAMP } from '../../utils/column.utils';

type inputType = inferProcedureInput<
  AppRouter['collectivites']['recherches']['collectivites']
>;

const input: inputType = {
  typesPlan: [],
  regions: [],
  departments: [],
  typesCollectivite: [],
  population: [],
  referentiel: [],
  niveauDeLabellisation: [],
  realiseCourant: [],
  tauxDeRemplissage: [],
  nbCards: 2,
};

const inputWithCondition: inputType = {
  typesPlan: [1, 2],
  nom: 'test avec condition',
  regions: ['27'],
  departments: ['51', '31'],
  typesCollectivite: ['syndicat'],
  population: ['<20000'],
  referentiel: ['eci'],
  niveauDeLabellisation: ['1', '2'],
  realiseCourant: ['50-64', '35-49'],
  tauxDeRemplissage: ['80-99'],
  trierPar: ['score'],
  page: 2,
  nbCards: 2,
};

/**
 * Test que les requêtes s'executent correctement càd sans erreurs de syntaxe
 */
describe('Test recherches collectivite', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let db: Awaited<ReturnType<typeof getTestDatabase>>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const testUserResult = await addTestUser(db);
    authenticatedUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Test tab "Collectivités"', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const result = await caller.collectivites.recherches.collectivites(input);
    expect(result.items.length).toEqual(2);
  });

  test('Test tab "Collectivités" avec conditions', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const result = await caller.collectivites.recherches.collectivites(
      inputWithCondition
    );
    expect(result.items.length).toEqual(0);
  });

  /**
   * Un service de l'État est une ligne `collectivite` sans en être : pas de
   * territoire, pas de référentiel, pas de plan. Il n'a rien à faire dans un
   * annuaire de collectivités, quel que soit l'onglet — et surtout pas dans une
   * recherche par nom, où « ADEME » ou « DREAL » les ramènerait tous.
   */
  test.each(servicesDeconcentresTypes)(
    'écarte les collectivités de type %s de la recherche',
    async (type) => {
      // Avec un membre actif : la recherche ne montre que les collectivités qui
      // en ont un, et sans lui le service serait écarté par ce filtre-là — le
      // test passerait sans rien prouver.
      const service = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: {
          type,
          nom: `Service test recherche ${type}`,
          // Un service national ne porte aucun code géographique, les autres en
          // portent un : le tirage évite l'index unique par région.
          ...(type === 'service_national'
            ? {}
            : { regionCode: await pickFreeRegionCode(db, type) }),
        },
      });
      onTestFinished(() => service.cleanup());

      const caller = router.createCaller({ user: authenticatedUser });
      const parNom = await caller.collectivites.recherches.collectivites({
        ...input,
        nom: 'Service test recherche',
        nbCards: 50,
      });

      expect(parNom.items).toEqual([]);
    }
  );

  test('Test tab "Référentiels"', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const result = await caller.collectivites.recherches.referentiels(input);
    expect(result.items.length).toEqual(2);
  });

  test('Test tab "Référentiels" avec conditions', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const result = await caller.collectivites.recherches.referentiels(
      inputWithCondition
    );
    expect(result.items.length).toEqual(0);
  });

  test('Test tab "Référentiels" filtre étoiles ciblé sur TE', async () => {
    const setup = await addTestCollectiviteAndUser(db);

    try {
      await db.db
        .delete(labellisationTable)
        .where(eq(labellisationTable.collectiviteId, setup.collectivite.id));

      await db.db.insert(labellisationTable).values([
        {
          collectiviteId: setup.collectivite.id,
          referentiel: 'te',
          obtenueLe: SQL_CURRENT_TIMESTAMP,
          etoiles: 3,
        },
        {
          collectiviteId: setup.collectivite.id,
          referentiel: 'eci',
          obtenueLe: SQL_CURRENT_TIMESTAMP,
          etoiles: 1,
        },
      ]);

      const caller = router.createCaller({ user: authenticatedUser });

      const teFilters: inputType = {
        ...input,
        referentiel: ['te'],
        niveauDeLabellisation: ['3'],
        nbCards: 50,
      };

      const teResult = await caller.collectivites.recherches.referentiels(
        teFilters
      );
      expect(
        teResult.items.some(
          (collectivite) =>
            collectivite.collectiviteId === setup.collectivite.id
        )
      ).toBe(true);

      const caeResult = await caller.collectivites.recherches.referentiels({
        ...teFilters,
        referentiel: ['cae'],
      });
      expect(
        caeResult.items.some(
          (collectivite) =>
            collectivite.collectiviteId === setup.collectivite.id
        )
      ).toBe(false);
    } finally {
      await db.db
        .delete(labellisationTable)
        .where(eq(labellisationTable.collectiviteId, setup.collectivite.id));
      await setup.cleanup();
    }
  });

  test('Test tab "Référentiels" filtre étoiles tous référentiels cochés (Tous)', async () => {
    const setup = await addTestCollectiviteAndUser(db);

    try {
      await db.db
        .delete(labellisationTable)
        .where(eq(labellisationTable.collectiviteId, setup.collectivite.id));

      await db.db.insert(labellisationTable).values({
        collectiviteId: setup.collectivite.id,
        referentiel: 'te',
        obtenueLe: SQL_CURRENT_TIMESTAMP,
        etoiles: 3,
      });

      const caller = router.createCaller({ user: authenticatedUser });

      const tousLesReferentielsFiltres: inputType = {
        ...input,
        referentiel: [],
        niveauDeLabellisation: ['3'],
        nbCards: 50,
      };

      const result = await caller.collectivites.recherches.referentiels(
        tousLesReferentielsFiltres
      );

      expect(
        result.items.some(
          (collectivite) =>
            collectivite.collectiviteId === setup.collectivite.id
        )
      ).toBe(true);
    } finally {
      await db.db
        .delete(labellisationTable)
        .where(eq(labellisationTable.collectiviteId, setup.collectivite.id));
      await setup.cleanup();
    }
  });

  test('Test tab "Plans d action"', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const result = await caller.collectivites.recherches.plans(input);
    expect(result.items.length).toEqual(2);
  });

  test('Test tab "Plans d action" avec conditions', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const result = await caller.collectivites.recherches.plans(
      inputWithCondition
    );
    expect(result.items.length).toEqual(0);
  });
});
