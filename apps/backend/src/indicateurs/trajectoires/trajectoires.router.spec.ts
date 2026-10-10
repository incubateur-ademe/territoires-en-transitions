import {
  ForbiddenException,
  INestApplication,
  UnprocessableEntityException,
} from '@nestjs/common';
import TrajectoiresDataService from '@tet/backend/indicateurs/trajectoires/trajectoires-data.service';
import { VerificationTrajectoireResponseType } from '@tet/backend/indicateurs/trajectoires/verification-trajectoire.response';
import { EPCI_FISCALITE_PROPRE_REQUIRED_MESSAGE } from '@tet/backend/indicateurs/trajectoires/verification-trajectoire.rules';
import {
  getAuthUserFromUserCredentials,
  getTestDatabase,
  getTestApp,
  getTestRouter,
} from '@tet/backend/test';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';
import { CollectiviteRole } from '@tet/domain/users';
import { inArray } from 'drizzle-orm';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { VerificationTrajectoireStatus } from '@tet/domain/indicateurs';
import { expect, vi } from 'vitest';

describe('Calcul de trajectoire SNBC', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  type Fixture = Awaited<ReturnType<typeof addTestCollectiviteAndUser>>;
  let commune: Fixture;
  let emptyEpci: Fixture;
  let existingEpci: Fixture;
  let forbiddenEpci: Fixture;
  const fixtures: Fixture[] = [];

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const database = await getTestDatabase(app);
    const createFixture = async (type: 'commune' | 'epci') => {
      const fixture = await addTestCollectiviteAndUser(database, {
        collectivite: {
          type,
          natureInsee: type === 'epci' ? 'CA' : null,
          siren:
            type === 'epci'
              ? String(900000000 + Math.floor(Math.random() * 99999999))
              : null,
        },
        user: { role: CollectiviteRole.LECTURE },
      });
      fixtures.push(fixture);
      return fixture;
    };
    commune = await createFixture('commune');
    emptyEpci = await createFixture('epci');
    existingEpci = await createFixture('epci');
    forbiddenEpci = await createFixture('epci');

    const trajectoiresDataService = app.get(TrajectoiresDataService);
    const sheetService = app.get(SheetService);
    const metadata =
      await trajectoiresDataService.getTrajectoireIndicateursMetadonnees();
    const definitions = await database.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          trajectoiresDataService.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL
        )
      );
    expect(definitions.length).toBeGreaterThan(0);
    await database.db.insert(indicateurValeurTable).values(
      definitions.map(({ id }) => ({
        collectiviteId: existingEpci.collectivite.id,
        indicateurId: id,
        periodicite: 'annuelle' as const,
        dateValeur: '2030-01-01',
        objectif: 1,
        metadonneeId: metadata.id,
        calculAuto: true,
      }))
    );
    const trajectoireRows = Array.from(
      {
        length:
          trajectoiresDataService
            .SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL.length,
      },
      () => ['1']
    );

    const sheetServiceSpies = [
      vi.spyOn(sheetService, 'getFileIdByName').mockResolvedValue(null),
      vi
        .spyOn(sheetService, 'copyFile')
        .mockResolvedValue('mock-trajectoire-sheet-id'),
      vi.spyOn(sheetService, 'overwriteRawDataToSheet').mockResolvedValue(),
      vi.spyOn(sheetService, 'getRawDataFromSheet').mockResolvedValue({
        data: trajectoireRows,
      }),
    ];

    return () => {
      sheetServiceSpies.forEach((spy) => spy.mockRestore());
    };
  });

  test(`Suppression sans acces`, async () => {
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(commune.user),
    });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.delete({
        collectiviteId: forbiddenEpci.collectivite.id,
      })
    ).toThrowTrpcHttpError(
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${commune.user.id} n'a pas l'autorisation indicateurs.valeurs.mutate sur la ressource Collectivité ${forbiddenEpci.collectivite.id}`
      )
    );
  });

  test(`Verification avec une commune`, async () => {
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(commune.user),
    });

    const statusResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: commune.collectivite.id,
      });

    expect(statusResponse).toMatchObject({
      status: VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
    });
  });

  test(`Calcul avec une commune`, async () => {
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(commune.user),
    });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.getOrCompute({
        collectiviteId: commune.collectivite.id,
      })
    ).toThrowTrpcHttpError(
      new UnprocessableEntityException(EPCI_FISCALITE_PROPRE_REQUIRED_MESSAGE)
    );
  });

  test(`Verification avec donnees manquantes`, async () => {
    const verificationReponseAttendue: VerificationTrajectoireResponseType = {
      status: VerificationTrajectoireStatus.DONNEES_MANQUANTES,
      epci: {
        type: 'epci',
        id: emptyEpci.collectivite.id,
        nom: emptyEpci.collectivite.nom,
        siren: emptyEpci.collectivite.siren as string,
        natureInsee: 'CA',
      },
      donneesEntree: {
        sources: [],
        emissionsGes: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_1.c'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.d'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.i'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.g'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.f'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.h'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_1.j'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_1.c',
            'cae_1.d',
            'cae_1.i',
            'cae_1.g',
            'cae_1.e',
            'cae_1.f',
            'cae_1.h',
            'cae_1.j',
          ],
        },
        consommationsFinales: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_2.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.f'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.k'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.i'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.g', 'cae_2.h'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.j'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_2.l_pcaet'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_2.e',
            'cae_2.f',
            'cae_2.k',
            'cae_2.i',
            'cae_2.g',
            'cae_2.h',
            'cae_2.j',
            'cae_2.l_pcaet',
          ],
        },
        sequestrations: {
          valeurs: [
            {
              identifiantsReferentiel: ['cae_63.ca'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cb'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.da'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cd'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.cc'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.db'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.b'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
            {
              identifiantsReferentiel: ['cae_63.e'],
              valeur: null,
              dateMin: null,
              dateMax: null,
            },
          ],
          identifiantsReferentielManquants: [
            'cae_63.ca',
            'cae_63.cb',
            'cae_63.da',
            'cae_63.cd',
            'cae_63.cc',
            'cae_63.db',
            'cae_63.b',
            'cae_63.e',
          ],
        },
        lastModifiedAt: null,
      },
    };

    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(emptyEpci.user),
    });

    const statusResponse =
      await caller.indicateurs.trajectoires.snbc.checkStatus({
        collectiviteId: emptyEpci.collectivite.id,
        epciInfo: true,
      });
    expect(statusResponse).toMatchObject(verificationReponseAttendue);
  });

  test(`Calcul avec donnees manquantes`, async () => {
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(emptyEpci.user),
    });

    await expect(() =>
      caller.indicateurs.trajectoires.snbc.getOrCompute({
        collectiviteId: emptyEpci.collectivite.id,
      })
    ).toThrowTrpcHttpError(
      new UnprocessableEntityException(
        `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : cae_1.c, cae_1.d, cae_1.i, cae_1.g, cae_1.e, cae_1.f, cae_1.h, cae_1.j, cae_2.e, cae_2.f, cae_2.k, cae_2.i, cae_2.g, cae_2.h, cae_2.j, cae_2.l_pcaet, impossible de calculer la trajectoire SNBC.`
      )
    );
  }, 10000);

  test(`Calcul/récupération avec droit suffisant - visite`, async () => {
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(commune.user),
    });

    const trajectoire = await caller.indicateurs.trajectoires.snbc.getOrCompute(
      {
        collectiviteId: existingEpci.collectivite.id,
      }
    );
    expect(trajectoire).toBeDefined();
  }, 30000);

  test(`Calcul/récupération avec droit suffisant - lecture`, async () => {
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(existingEpci.user),
    });

    const trajectoire = await caller.indicateurs.trajectoires.snbc.getOrCompute(
      {
        collectiviteId: existingEpci.collectivite.id,
      }
    );
    expect(trajectoire).toBeDefined();
  }, 30000);

  afterAll(async () => {
    const database = await getTestDatabase(app);
    if (fixtures.length) {
      await database.db.delete(indicateurValeurTable).where(
        inArray(
          indicateurValeurTable.collectiviteId,
          fixtures.map(({ collectivite }) => collectivite.id)
        )
      );
    }
    for (const fixture of fixtures.reverse()) await fixture.cleanup();
    await app.close();
  }, 30000);
});
