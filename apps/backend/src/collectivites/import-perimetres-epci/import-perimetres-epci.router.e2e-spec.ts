import { INestApplication } from '@nestjs/common';
import { collectivitePerimetreSecondaireTable } from '@tet/backend/collectivites/shared/models/collectivite-perimetre-secondaire.table';
import {
  getAnonUser,
  getCollectiviteIdBySiren,
  getServiceRoleUser,
} from '@tet/backend/test';
import { AuthRole, AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq, sql } from 'drizzle-orm';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { TrpcRouter } from '../../utils/trpc/trpc.router';

/** Redon Agglomération : siège en Ille-et-Vilaine, communes en 44 et 56. */
const REDON_SIREN = '243500741';

/**
 * L'import réécrit `imports.epci_commune` en entier et recalcule tous les
 * périmètres : deux fichiers de test ne peuvent pas le jouer en même temps.
 * Verrou distinct de celui de l'import des relations (2 422 003), qui lit le
 * même CSV mais écrit ailleurs.
 */
const VERROU = 2_422_012;

describe("Route d'import des périmètres secondaires des EPCI", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let database: DatabaseService;
  let anonUser: AuthUser<AuthRole.ANON>;
  let serviceRoleUser: AuthUser<AuthRole.SERVICE_ROLE>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    database = await getTestDatabase(app);
    anonUser = getAnonUser();
    serviceRoleUser = getServiceRoleUser();
  });

  /**
   * Le verrou est posé sur une connexion **épinglée** : `db.execute` en prend une
   * différente à chaque appel, et le `unlock` tomberait alors sur une session qui
   * ne détient rien — le verrou fuirait sur une connexion du pool et bloquerait
   * l'appel suivant. Même geste que `withCollectiviteRelationsImportLock`.
   */
  const sousVerrou = async <T,>(action: () => Promise<T>): Promise<T> => {
    const client = await database.db.$client.connect();
    try {
      await client.query('SELECT pg_advisory_lock($1)', [VERROU]);
      return await action();
    } finally {
      await client
        .query('SELECT pg_advisory_unlock($1)', [VERROU])
        .catch(() => undefined);
      client.release();
    }
  };

  const perimetresDe = async (siren: string) => {
    const collectiviteId = await getCollectiviteIdBySiren(database, siren);
    const lignes = await database.db
      .select({
        departementCode: collectivitePerimetreSecondaireTable.departementCode,
        regionCode: collectivitePerimetreSecondaireTable.regionCode,
      })
      .from(collectivitePerimetreSecondaireTable)
      .where(
        and(
          eq(collectivitePerimetreSecondaireTable.collectiviteId, collectiviteId),
          eq(collectivitePerimetreSecondaireTable.source, 'banatic')
        )
      );

    return {
      departements: lignes
        .map(({ departementCode }) => departementCode)
        .filter((code): code is string => code !== null)
        .sort(),
      regions: lignes
        .map(({ regionCode }) => regionCode)
        .filter((code): code is string => code !== null)
        .sort(),
    };
  };

  test('refuse un appelant qui n’est pas service role', async () => {
    const sansUtilisateur = router.createCaller({ user: null });
    await expect(
      sansUtilisateur.collectivites.perimetres.importPerimetresEpci()
    ).rejects.toThrowError(/not service role/i);

    const anonyme = router.createCaller({ user: anonUser });
    await expect(
      anonyme.collectivites.perimetres.importPerimetresEpci()
    ).rejects.toThrowError(/not service role/i);
  });

  test('calcule les périmètres depuis la composition communale complète', async () => {
    const caller = router.createCaller({ user: serviceRoleUser });

    const resultat = await sousVerrou(() =>
      // Le fichier committé plutôt que data.gouv : un test ne dépend d'aucun réseau.
      caller.collectivites.perimetres.importPerimetresEpci({
        depuisDatagouv: false,
      })
    );

    expect(resultat.origine).toBe('fichier-committe');
    // Toutes les communes membres, sans seuil de population : c'est ce qui
    // distingue cette source de `collectivite_relations`, qui n'en garde qu'un
    // dixième et manquerait la plupart des EPCI à cheval.
    expect(resultat.communes).toBeGreaterThan(34_000);
    expect(resultat.epci).toBeGreaterThan(1_200);
    expect(resultat.perimetres).toBeGreaterThan(100);
  });

  test('Redon Agglomération déborde sur deux départements et une région', async () => {
    const caller = router.createCaller({ user: serviceRoleUser });
    await sousVerrou(() =>
      caller.collectivites.perimetres.importPerimetresEpci({
        depuisDatagouv: false,
      })
    );

    expect(await perimetresDe(REDON_SIREN)).toEqual({
      departements: ['44', '56'],
      regions: ['52'],
    });
  });

  test('rejouer l’import ne duplique rien', async () => {
    const caller = router.createCaller({ user: serviceRoleUser });

    const { premier, second } = await sousVerrou(async () => {
      const premier = await caller.collectivites.perimetres.importPerimetresEpci(
        { depuisDatagouv: false }
      );
      const second = await caller.collectivites.perimetres.importPerimetresEpci({
        depuisDatagouv: false,
      });
      return { premier, second };
    });

    expect(second).toEqual(premier);
    expect(await perimetresDe(REDON_SIREN)).toEqual({
      departements: ['44', '56'],
      regions: ['52'],
    });
  });

  test('le rejeu laisse intactes les lignes de l’import des services de l’État', async () => {
    const caller = router.createCaller({ user: serviceRoleUser });

    const avant = await database.db
      .select({ nombre: sql<number>`count(*)::int` })
      .from(collectivitePerimetreSecondaireTable)
      .where(
        eq(collectivitePerimetreSecondaireTable.source, 'import_service_etat')
      );

    await sousVerrou(() =>
      caller.collectivites.perimetres.importPerimetresEpci({
        depuisDatagouv: false,
      })
    );

    const apres = await database.db
      .select({ nombre: sql<number>`count(*)::int` })
      .from(collectivitePerimetreSecondaireTable)
      .where(
        eq(collectivitePerimetreSecondaireTable.source, 'import_service_etat')
      );

    expect(apres[0].nombre).toBe(avant[0].nombre);
  });
});
