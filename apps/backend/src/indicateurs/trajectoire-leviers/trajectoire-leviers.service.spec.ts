import { Test } from '@nestjs/testing';
import ListCollectivitesService from '@tet/backend/collectivites/list-collectivites/list-collectivites.service';
import { TrajectoireSnbc3FeatureFlagService } from '@tet/backend/indicateurs/trajectoires/trajectoire-snbc3-feature-flag.service';
import TrajectoiresDataService from '@tet/backend/indicateurs/trajectoires/trajectoires-data.service';
import ManageIndicateurValeursService from '@tet/backend/indicateurs/valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { IndicateurValeursError } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs.errors';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { GetTrajectoireLeviersDataResponse } from './get-trajectoire-leviers-data.response';
import { TrajectoireLeviersService } from './trajectoire-leviers.service';

describe('TrajectoireLeviersService', () => {
  let trajectoireLeviersService: TrajectoireLeviersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [TrajectoireLeviersService],
    })
      .useMocker((token) => {
        if (
          token === ListCollectivitesService ||
          token === PermissionService ||
          token === ManageIndicateurValeursService ||
          token === TrajectoiresDataService ||
          token === TrajectoireSnbc3FeatureFlagService
        ) {
          return {};
        }
      })
      .compile();

    trajectoireLeviersService = moduleRef.get(TrajectoireLeviersService);
  });

  describe('computeObjectifReduction', () => {
    test('should compute objectifReduction for levier without sousSecteurIdentifiants and all secteur data', () => {
      const response: GetTrajectoireLeviersDataResponse = {
        sourcesResultats: [],
        identifiantManquants: [],
        secteurs: [
          {
            nom: 'Test Secteur',
            identifiants: ['cae_1.c'],
            couleur: undefined,
            resultat2019: 100,
            objectif2019: 90,
            objectif2030: 80,
            sousSecteurs: [],
            leviers: [
              {
                nom: 'Test Levier',
                sousSecteursIdentifiants: undefined,
                pourcentageRegional: 50,
                objectifReduction: null,
              },
            ],
          },
        ],
      };

      // Access private method using any type
      (trajectoireLeviersService as any).computeObjectifReduction(response);

      expect(response.secteurs[0].leviers[0].objectifReduction).toBe(-10);
    });

    test('should compute objectifReduction for levier without sousSecteurIdentifiants and only objectif2019 and objectif2030 secteur data', () => {
      const response: GetTrajectoireLeviersDataResponse = {
        sourcesResultats: [],
        identifiantManquants: [],
        secteurs: [
          {
            nom: 'Test Secteur',
            identifiants: ['cae_1.c'],
            couleur: undefined,
            resultat2019: null,
            objectif2019: 90,
            objectif2030: 80,
            sousSecteurs: [],
            leviers: [
              {
                nom: 'Test Levier',
                sousSecteursIdentifiants: undefined,
                pourcentageRegional: 50,
                objectifReduction: null,
              },
            ],
          },
        ],
      };

      (trajectoireLeviersService as any).computeObjectifReduction(response);

      expect(response.secteurs[0].leviers[0].objectifReduction).toBe(-5);
    });

    test('should compute objectifReduction for levier with two sousSecteurIdentifiants with data for both of them', () => {
      const response: GetTrajectoireLeviersDataResponse = {
        sourcesResultats: [],
        identifiantManquants: [],
        secteurs: [
          {
            nom: 'Test Secteur',
            identifiants: ['cae_1.c'],
            couleur: undefined,
            resultat2019: null,
            objectif2019: null,
            objectif2030: null,
            sousSecteurs: [
              {
                nom: 'Sous-secteur 1',
                identifiant: 'cae_1.ga',
                resultat2019: 50,
                objectif2019: 45,
                objectif2030: 40,
              },
              {
                nom: 'Sous-secteur 2',
                identifiant: 'cae_1.gb',
                resultat2019: 30,
                objectif2019: 25,
                objectif2030: 20,
              },
            ],
            leviers: [
              {
                nom: 'Test Levier',
                sousSecteursIdentifiants: ['cae_1.ga', 'cae_1.gb'],
                pourcentageRegional: 50,
                objectifReduction: null,
              },
            ],
          },
        ],
      };

      (trajectoireLeviersService as any).computeObjectifReduction(response);

      expect(response.secteurs[0].leviers[0].objectifReduction).toBe(-10);
    });

    test('should not compute objectifReduction for levier with two sousSecteurIdentifiants with data for one of them', () => {
      const response: GetTrajectoireLeviersDataResponse = {
        sourcesResultats: [],
        identifiantManquants: [],
        secteurs: [
          {
            nom: 'Test Secteur',
            identifiants: ['cae_1.c'],
            couleur: undefined,
            resultat2019: null,
            objectif2019: null,
            objectif2030: null,
            sousSecteurs: [
              {
                nom: 'Sous-secteur 1',
                identifiant: 'cae_1.ga',
                resultat2019: 50,
                objectif2019: 50,
                objectif2030: 40,
              },
              {
                nom: 'Sous-secteur 2',
                identifiant: 'cae_1.gb',
                resultat2019: null,
                objectif2019: null,
                objectif2030: 20,
              },
            ],
            leviers: [
              {
                nom: 'Test Levier',
                sousSecteursIdentifiants: ['cae_1.ga', 'cae_1.gb'],
                pourcentageRegional: 50,
                objectifReduction: null,
              },
            ],
          },
        ],
      };

      (trajectoireLeviersService as any).computeObjectifReduction(response);

      expect(response.secteurs[0].leviers[0].objectifReduction).toBe(null);
    });

    test('should handle case where secteur has no objectif2030', () => {
      const response: GetTrajectoireLeviersDataResponse = {
        sourcesResultats: [],
        identifiantManquants: [],
        secteurs: [
          {
            nom: 'Test Secteur',
            identifiants: ['cae_1.c'],
            couleur: undefined,
            resultat2019: 100,
            objectif2019: 100,
            objectif2030: null,
            sousSecteurs: [],
            leviers: [
              {
                nom: 'Test Levier',
                sousSecteursIdentifiants: undefined,
                pourcentageRegional: 50,
                objectifReduction: null,
              },
            ],
          },
        ],
      };

      (trajectoireLeviersService as any).computeObjectifReduction(response);

      expect(response.secteurs[0].leviers[0].objectifReduction).toBeNull();
    });

    test('should handle case where secteur has no 2019 data', () => {
      const response: GetTrajectoireLeviersDataResponse = {
        sourcesResultats: [],
        identifiantManquants: [],
        secteurs: [
          {
            nom: 'Test Secteur',
            identifiants: ['cae_1.c'],
            couleur: undefined,
            resultat2019: null,
            objectif2019: null,
            objectif2030: 80,
            sousSecteurs: [],
            leviers: [
              {
                nom: 'Test Levier',
                sousSecteursIdentifiants: undefined,
                pourcentageRegional: 50,
                objectifReduction: null,
              },
            ],
          },
        ],
      };

      (trajectoireLeviersService as any).computeObjectifReduction(response);

      expect(response.secteurs[0].leviers[0].objectifReduction).toBeNull();
    });
  });

  describe('getData : échec de lecture des valeurs', () => {
    const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');
    const input = { collectiviteId: 1 };
    const collectivite = {
      id: 1,
      nom: 'Test',
      type: 'epci',
      regionCode: '11',
    };

    const toServiceWithFailingListing = ({
      isSnbc3Enabled,
      error,
      cause,
    }: {
      isSnbc3Enabled: boolean;
      error: IndicateurValeursError;
      cause: Error;
    }) =>
      new TrajectoireLeviersService(
        {
          getCollectiviteByAnyIdentifiant: vi
            .fn()
            .mockResolvedValue(collectivite),
        } as never,
        { isAllowed: vi.fn().mockResolvedValue(success(undefined)) } as never,
        {
          listIndicateurValeurs: vi
            .fn()
            .mockResolvedValue(failure(error, cause)),
        } as never,
        { SNBC_SOURCE: { id: 'snbc' } } as never,
        {
          isTrajectoireSnbc3Enabled: vi.fn().mockResolvedValue(isSnbc3Enabled),
        } as never
      );

    it.each([
      { isSnbc3Enabled: false, chemin: 'SNBC' },
      { isSnbc3Enabled: true, chemin: 'SNBC 3' },
    ])(
      'chemin $chemin : un refus de lecture ressort en UNAUTHORIZED avec sa cause',
      async ({ isSnbc3Enabled }) => {
        const cause = new Error('Droits insuffisants');

        const result = await toServiceWithFailingListing({
          isSnbc3Enabled,
          error: 'UNAUTHORIZED',
          cause,
        }).getData(input, user);

        expect(result).toEqual({
          success: false,
          error: 'UNAUTHORIZED',
          cause,
        });
      }
    );

    it.each([
      { isSnbc3Enabled: false, chemin: 'SNBC' },
      { isSnbc3Enabled: true, chemin: 'SNBC 3' },
    ])(
      'chemin $chemin : une valeur invalide ressort en SERVER_ERROR avec sa cause',
      async ({ isSnbc3Enabled }) => {
        const cause = new Error(
          'indicateurIds or identifiantsReferentiel required'
        );

        const result = await toServiceWithFailingListing({
          isSnbc3Enabled,
          error: 'INVALID_VALUE',
          cause,
        }).getData(input, user);

        expect(result).toEqual({
          success: false,
          error: 'SERVER_ERROR',
          cause,
        });
      }
    );
  });
});
