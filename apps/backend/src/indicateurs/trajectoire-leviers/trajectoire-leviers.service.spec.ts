import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import { ListDefinitionsService } from '@/backend/indicateurs/list-definitions/list-definitions.service';
import TrajectoiresDataService from '@/backend/indicateurs/trajectoires/trajectoires-data.service';
import CrudValeursService from '@/backend/indicateurs/valeurs/crud-valeurs.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { Test } from '@nestjs/testing';
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
          token === CrudValeursService ||
          token === ListDefinitionsService ||
          token === TrajectoiresDataService
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
});
