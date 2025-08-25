import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';

import { ListDefinitionsService } from '@/backend/indicateurs/list-definitions/list-definitions.service';
import { GetMondrianLeviersDataRequest } from '@/backend/indicateurs/mondrian/get-mondrian-leviers-data.request';
import {
  GetMondrianLeviersDataResponse,
  MondrianLevier,
  MondrianSecteur,
  MondrianSousSecteur,
} from '@/backend/indicateurs/mondrian/get-mondrian-leviers-data.response';
import { GetIndicateursValeursResponseType } from '@/backend/indicateurs/shared/models/get-indicateurs.response';
import { IndicateurValeurGroupee } from '@/backend/indicateurs/shared/models/indicateur-valeur.table';
import TrajectoiresDataService from '@/backend/indicateurs/trajectoires/trajectoires-data.service';
import CrudValeursService from '@/backend/indicateurs/valeurs/crud-valeurs.service';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { roundTo } from '@/backend/utils/number.utils';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { isNil } from 'es-toolkit';
import { MondrianLeviersRegionConfiguration } from './mondrian-leviers-region-configuration.dto';

@Injectable()
export class MondrianLeviersService {
  private readonly logger = new Logger(MondrianLeviersService.name);

  private readonly REFERENCE_YEAR = 2019;
  private readonly TARGET_YEAR = 2030;

  private readonly MONDRIAN_LEVIERS_CONFIGURATION: MondrianLeviersRegionConfiguration =
    {
      secteurs: [
        {
          nom: 'Résidentiel',
          identifiants: ['cae_1.c'],
          leviers: [
            {
              nom: 'Changement chaudières fioul + rénovation (résidentiel)',
              pourcentagesRegionaux: {
                '84': 43, // Auvergne-Rhône-Alpes
                '27': 48, // Bourgogne-Franche-Comté
                '53': 51, // Bretagne
                '24': 40, // Centre-Val de Loire
                '94': 10, // Corse
                '44': 43, // Grand Est
                '32': 31, // Hauts-de-France
                '11': 24, // Île-de-France
                '28': 45, // Normandie
                '75': 41, // Nouvelle-Aquitaine
                '76': 41, // Occitanie
                '52': 41, // Pays de la Loire
                '93': 42, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Changement chaudières gaz + rénovation (résidentiel)',
              pourcentagesRegionaux: {
                '84': 32, // Auvergne-Rhône-Alpes
                '27': 28, // Bourgogne-Franche-Comté
                '53': 26, // Bretagne
                '24': 32, // Centre-Val de Loire
                '94': 17, // Corse
                '44': 33, // Grand Est
                '32': 43, // Hauts-de-France
                '11': 47, // Île-de-France
                '28': 29, // Normandie
                '75': 32, // Nouvelle-Aquitaine
                '76': 32, // Occitanie
                '52': 34, // Pays de la Loire
                '93': 32, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Sobriété des bâtiments (résidentiel)',
              pourcentagesRegionaux: {
                '84': 25, // Auvergne-Rhône-Alpes
                '27': 23, // Bourgogne-Franche-Comté
                '53': 23, // Bretagne
                '24': 28, // Centre-Val de Loire
                '94': 73, // Corse
                '44': 24, // Grand Est
                '32': 26, // Hauts-de-France
                '11': 28, // Île-de-France
                '28': 26, // Normandie
                '75': 27, // Nouvelle-Aquitaine
                '76': 26, // Occitanie
                '52': 25, // Pays de la Loire
                '93': 26, // Provence-Alpes-Côte d'Azur
              },
            },
          ],
        },
        {
          nom: 'Tertiaire',
          identifiants: ['cae_1.d'],
          leviers: [
            {
              nom: 'Changement de chaudière à fioul (tertiaire)',
              pourcentagesRegionaux: {
                '84': 37, // Auvergne-Rhône-Alpes
                '27': 39, // Bourgogne-Franche-Comté
                '53': 32, // Bretagne
                '24': 43, // Centre-Val de Loire
                '94': 50, // Corse
                '44': 36, // Grand Est
                '32': 33, // Hauts-de-France
                '11': 15, // Île-de-France
                '28': 40, // Normandie
                '75': 41, // Nouvelle-Aquitaine
                '76': 38, // Occitanie
                '52': 39, // Pays de la Loire
                '93': 31, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Changement de chaudière à gaz (tertiaire)',
              pourcentagesRegionaux: {
                '84': 17, // Auvergne-Rhône-Alpes
                '27': 19, // Bourgogne-Franche-Comté
                '53': 23, // Bretagne
                '24': 16, // Centre-Val de Loire
                '94': 0, // Corse
                '44': 21, // Grand Est
                '32': 21, // Hauts-de-France
                '11': 24, // Île-de-France
                '28': 17, // Normandie
                '75': 15, // Nouvelle-Aquitaine
                '76': 14, // Occitanie
                '52': 19, // Pays de la Loire
                '93': 16, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Sobriété et isolation des bâtiments (tertiaire)',
              pourcentagesRegionaux: {
                '84': 45, // Auvergne-Rhône-Alpes
                '27': 42, // Bourgogne-Franche-Comté
                '53': 46, // Bretagne
                '24': 42, // Centre-Val de Loire
                '94': 50, // Corse
                '44': 43, // Grand Est
                '32': 47, // Hauts-de-France
                '11': 60, // Île-de-France
                '28': 43, // Normandie
                '75': 43, // Nouvelle-Aquitaine
                '76': 48, // Occitanie
                '52': 42, // Pays de la Loire
                '93': 53, // Provence-Alpes-Côte d'Azur
              },
            },
          ],
        },
        {
          nom: 'Transports',
          identifiants: ['cae_1.k'],
          leviers: [
            {
              nom: 'Réduction des déplacements',
              pourcentagesRegionaux: {
                '84': 5, // Auvergne-Rhône-Alpes
                '27': 4, // Bourgogne-Franche-Comté
                '53': 5, // Bretagne
                '24': 4, // Centre-Val de Loire
                '94': 8, // Corse
                '44': 4, // Grand Est
                '32': 4, // Hauts-de-France
                '11': 8, // Île-de-France
                '28': 4, // Normandie
                '75': 5, // Nouvelle-Aquitaine
                '76': 5, // Occitanie
                '52': 5, // Pays de la Loire
                '93': 6, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Covoiturage',
              pourcentagesRegionaux: {
                '84': 5, // Auvergne-Rhône-Alpes
                '27': 4, // Bourgogne-Franche-Comté
                '53': 5, // Bretagne
                '24': 4, // Centre-Val de Loire
                '94': 8, // Corse
                '44': 4, // Grand Est
                '32': 4, // Hauts-de-France
                '11': 8, // Île-de-France
                '28': 4, // Normandie
                '75': 5, // Nouvelle-Aquitaine
                '76': 5, // Occitanie
                '52': 5, // Pays de la Loire
                '93': 6, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Vélo et transport en commun',
              pourcentagesRegionaux: {
                '84': 8, // Auvergne-Rhône-Alpes
                '27': 7, // Bourgogne-Franche-Comté
                '53': 8, // Bretagne
                '24': 7, // Centre-Val de Loire
                '94': 14, // Corse
                '44': 7, // Grand Est
                '32': 7, // Hauts-de-France
                '11': 13, // Île-de-France
                '28': 7, // Normandie
                '75': 8, // Nouvelle-Aquitaine
                '76': 9, // Occitanie
                '52': 8, // Pays de la Loire
                '93': 9, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Véhicules électriques',
              pourcentagesRegionaux: {
                '84': 19, // Auvergne-Rhône-Alpes
                '27': 18, // Bourgogne-Franche-Comté
                '53': 20, // Bretagne
                '24': 18, // Centre-Val de Loire
                '94': 32, // Corse
                '44': 18, // Grand Est
                '32': 16, // Hauts-de-France
                '11': 20, // Île-de-France
                '28': 18, // Normandie
                '75': 19, // Nouvelle-Aquitaine
                '76': 22, // Occitanie
                '52': 19, // Pays de la Loire
                '93': 21, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Efficacité et carburants décarbonés des véhicules privés',
              pourcentagesRegionaux: {
                '84': 10, // Auvergne-Rhône-Alpes
                '27': 10, // Bourgogne-Franche-Comté
                '53': 11, // Bretagne
                '24': 10, // Centre-Val de Loire
                '94': 17, // Corse
                '44': 10, // Grand Est
                '32': 9, // Hauts-de-France
                '11': 11, // Île-de-France
                '28': 10, // Normandie
                '75': 11, // Nouvelle-Aquitaine
                '76': 12, // Occitanie
                '52': 10, // Pays de la Loire
                '93': 12, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Bus et cars décarbonés',
              pourcentagesRegionaux: {
                '84': 1, // Auvergne-Rhône-Alpes
                '27': 1, // Bourgogne-Franche-Comté
                '53': 1, // Bretagne
                '24': 1, // Centre-Val de Loire
                '94': 3, // Corse
                '44': 1, // Grand Est
                '32': 1, // Hauts-de-France
                '11': 2, // Île-de-France
                '28': 1, // Normandie
                '75': 1, // Nouvelle-Aquitaine
                '76': 1, // Occitanie
                '52': 1, // Pays de la Loire
                '93': 2, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Fret décarboné et multimodalité',
              pourcentagesRegionaux: {
                '84': 23, // Auvergne-Rhône-Alpes
                '27': 25, // Bourgogne-Franche-Comté
                '53': 22, // Bretagne
                '24': 25, // Centre-Val de Loire
                '94': 8, // Corse
                '44': 25, // Grand Est
                '32': 26, // Hauts-de-France
                '11': 17, // Île-de-France
                '28': 25, // Normandie
                '75': 23, // Nouvelle-Aquitaine
                '76': 20, // Occitanie
                '52': 24, // Pays de la Loire
                '93': 20, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Efficacité et sobriété logistique',
              pourcentagesRegionaux: {
                '84': 28, // Auvergne-Rhône-Alpes
                '27': 31, // Bourgogne-Franche-Comté
                '53': 28, // Bretagne
                '24': 31, // Centre-Val de Loire
                '94': 9, // Corse
                '44': 31, // Grand Est
                '32': 32, // Hauts-de-France
                '11': 21, // Île-de-France
                '28': 30, // Normandie
                '75': 29, // Nouvelle-Aquitaine
                '76': 25, // Occitanie
                '52': 29, // Pays de la Loire
                '93': 25, // Provence-Alpes-Côte d'Azur
              },
            },
          ],
        },
        {
          nom: 'Agriculture, Forêts et Sols',
          identifiants: ['cae_1.g'],
          leviers: [
            {
              nom: 'Bâtiments & Machines agricoles',
              sousSecteursIdentifiants: ['cae_1.ga'],
              pourcentagesRegionaux: {
                '84': 100, // Auvergne-Rhône-Alpes
                '27': 100, // Bourgogne-Franche-Comté
                '53': 100, // Bretagne
                '24': 100, // Centre-Val de Loire
                '94': 100, // Corse
                '44': 100, // Grand Est
                '32': 100, // Hauts-de-France
                '11': 100, // Île-de-France
                '28': 100, // Normandie
                '75': 100, // Nouvelle-Aquitaine
                '76': 100, // Occitanie
                '52': 100, // Pays de la Loire
                '93': 100, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Elevage durable',
              sousSecteursIdentifiants: ['cae_1.gb'],
              pourcentagesRegionaux: {
                '84': 100, // Auvergne-Rhône-Alpes
                '27': 100, // Bourgogne-Franche-Comté
                '53': 100, // Bretagne
                '24': 100, // Centre-Val de Loire
                '94': 100, // Corse
                '44': 100, // Grand Est
                '32': 100, // Hauts-de-France
                '11': 100, // Île-de-France
                '28': 100, // Normandie
                '75': 100, // Nouvelle-Aquitaine
                '76': 100, // Occitanie
                '52': 100, // Pays de la Loire
                '93': 100, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Changements de pratiques de fertilisation azotée',
              sousSecteursIdentifiants: ['cae_1.gc'],
              pourcentagesRegionaux: {
                '84': 100, // Auvergne-Rhône-Alpes
                '27': 100, // Bourgogne-Franche-Comté
                '53': 100, // Bretagne
                '24': 100, // Centre-Val de Loire
                '94': 100, // Corse
                '44': 100, // Grand Est
                '32': 100, // Hauts-de-France
                '11': 100, // Île-de-France
                '28': 100, // Normandie
                '75': 100, // Nouvelle-Aquitaine
                '76': 100, // Occitanie
                '52': 100, // Pays de la Loire
                '93': 100, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Gestion des forêts et produits bois',
              sousSecteursIdentifiants: [
                'cae_63.b', // Forêt
                'cae_63.e', //Produits bois
              ],
              pourcentagesRegionaux: {
                '84': 100, // Auvergne-Rhône-Alpes
                '27': 100, // Bourgogne-Franche-Comté
                '53': 100, // Bretagne
                '24': 100, // Centre-Val de Loire
                '94': 100, // Corse
                '44': 100, // Grand Est
                '32': 100, // Hauts-de-France
                '11': 100, // Île-de-France
                '28': 100, // Normandie
                '75': 100, // Nouvelle-Aquitaine
                '76': 100, // Occitanie
                '52': 100, // Pays de la Loire
                '93': 100, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Pratiques stockantes',
              sousSecteursIdentifiants: [
                'cae_63.ca', // Culture
              ],
              pourcentagesRegionaux: {
                '84': 34, // Auvergne-Rhône-Alpes
                '27': 41, // Bourgogne-Franche-Comté
                '53': 55, // Bretagne
                '24': 53, // Centre-Val de Loire
                '94': 5, // Corse
                '44': 50, // Grand Est
                '32': 54, // Hauts-de-France
                '11': 57, // Île-de-France
                '28': 46, // Normandie
                '75': 47, // Nouvelle-Aquitaine
                '76': 40, // Occitanie
                '52': 51, // Pays de la Loire
                '93': 26, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Gestion des haies',
              sousSecteursIdentifiants: [
                'cae_63.ca', // Culture
              ],
              pourcentagesRegionaux: {
                '84': 66, // Auvergne-Rhône-Alpes
                '27': 59, // Bourgogne-Franche-Comté
                '53': 45, // Bretagne
                '24': 47, // Centre-Val de Loire
                '94': 95, // Corse
                '44': 50, // Grand Est
                '32': 46, // Hauts-de-France
                '11': 43, // Île-de-France
                '28': 54, // Normandie
                '75': 53, // Nouvelle-Aquitaine
                '76': 60, // Occitanie
                '52': 49, // Pays de la Loire
                '93': 74, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Gestion des prairies',
              sousSecteursIdentifiants: [
                'cae_63.cb', // Prairies
              ],
              pourcentagesRegionaux: {
                '84': 100, // Auvergne-Rhône-Alpes
                '27': 100, // Bourgogne-Franche-Comté
                '53': 100, // Bretagne
                '24': 100, // Centre-Val de Loire
                '94': 100, // Corse
                '44': 100, // Grand Est
                '32': 100, // Hauts-de-France
                '11': 100, // Île-de-France
                '28': 100, // Normandie
                '75': 100, // Nouvelle-Aquitaine
                '76': 100, // Occitanie
                '52': 100, // Pays de la Loire
                '93': 100, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Sobriété foncière',
              sousSecteursIdentifiants: [
                'cae_63.db', // Sols artificiels
              ],
              pourcentagesRegionaux: {
                '84': 100, // Auvergne-Rhône-Alpes
                '27': 100, // Bourgogne-Franche-Comté
                '53': 100, // Bretagne
                '24': 100, // Centre-Val de Loire
                '94': 100, // Corse
                '44': 100, // Grand Est
                '32': 100, // Hauts-de-France
                '11': 100, // Île-de-France
                '28': 100, // Normandie
                '75': 100, // Nouvelle-Aquitaine
                '76': 100, // Occitanie
                '52': 100, // Pays de la Loire
                '93': 100, // Provence-Alpes-Côte d'Azur
              },
            },
          ],
        },
        {
          nom: 'Industrie',
          identifiants: ['cae_1.i', 'cae_1.csc'], // Industrie (hors branche énergie) et Stockage de carbone
          leviers: [
            {
              nom: 'Production industrielle',
              pourcentagesRegionaux: {
                '84': 100, // Auvergne-Rhône-Alpes
                '27': 100, // Bourgogne-Franche-Comté
                '53': 100, // Bretagne
                '24': 100, // Centre-Val de Loire
                '94': 100, // Corse
                '44': 100, // Grand Est
                '32': 100, // Hauts-de-France
                '11': 100, // Île-de-France
                '28': 100, // Normandie
                '75': 100, // Nouvelle-Aquitaine
                '76': 100, // Occitanie
                '52': 100, // Pays de la Loire
                '93': 100, // Provence-Alpes-Côte d'Azur
              },
            },
          ],
        },
        {
          nom: 'Déchets',
          identifiants: ['cae_1.h'],
          leviers: [
            {
              nom: 'Captage de méthane dans les ISDND',
              pourcentagesRegionaux: {
                '84': 59, // Auvergne-Rhône-Alpes
                '27': 66, // Bourgogne-Franche-Comté
                '53': 43, // Bretagne
                '24': 64, // Centre-Val de Loire
                '94': 64, // Corse
                '44': 60, // Grand Est
                '32': 66, // Hauts-de-France
                '11': 63, // Île-de-France
                '28': 62, // Normandie
                '75': 62, // Nouvelle-Aquitaine
                '76': 61, // Occitanie
                '52': 64, // Pays de la Loire
                '93': 53, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Prévention des déchets',
              pourcentagesRegionaux: {
                '84': 7, // Auvergne-Rhône-Alpes
                '27': 6, // Bourgogne-Franche-Comté
                '53': 11, // Bretagne
                '24': 6, // Centre-Val de Loire
                '94': 5, // Corse
                '44': 6, // Grand Est
                '32': 6, // Hauts-de-France
                '11': 5, // Île-de-France
                '28': 6, // Normandie
                '75': 7, // Nouvelle-Aquitaine
                '76': 7, // Occitanie
                '52': 7, // Pays de la Loire
                '93': 7, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Valorisation matière des déchets',
              pourcentagesRegionaux: {
                '84': 35, // Auvergne-Rhône-Alpes
                '27': 28, // Bourgogne-Franche-Comté
                '53': 46, // Bretagne
                '24': 30, // Centre-Val de Loire
                '94': 31, // Corse
                '44': 34, // Grand Est
                '32': 28, // Hauts-de-France
                '11': 32, // Île-de-France
                '28': 32, // Normandie
                '75': 30, // Nouvelle-Aquitaine
                '76': 33, // Occitanie
                '52': 30, // Pays de la Loire
                '93': 40, // Provence-Alpes-Côte d'Azur
              },
            },
          ],
        },
        {
          nom: 'Energie',
          identifiants: ['cae_1.j'],
          leviers: [
            {
              nom: 'Electricité renouvelable',
              pourcentagesRegionaux: {
                '84': 50, // Auvergne-Rhône-Alpes
                '27': 101, // Bourgogne-Franche-Comté
                '53': 88, // Bretagne
                '24': 96, // Centre-Val de Loire
                '94': 52, // Corse
                '44': 44, // Grand Est
                '32': 25, // Hauts-de-France
                '11': 15, // Île-de-France
                '28': 20, // Normandie
                '75': 95, // Nouvelle-Aquitaine
                '76': 67, // Occitanie
                '52': 39, // Pays de la Loire
                '93': 96, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Biogaz',
              pourcentagesRegionaux: {
                '84': 44, // Auvergne-Rhône-Alpes
                '27': 78, // Bourgogne-Franche-Comté
                '53': 163, // Bretagne
                '24': 110, // Centre-Val de Loire
                '94': 40, // Corse
                '44': 79, // Grand Est
                '32': 61, // Hauts-de-France
                '11': 15, // Île-de-France
                '28': 77, // Normandie
                '75': 94, // Nouvelle-Aquitaine
                '76': 59, // Occitanie
                '52': 85, // Pays de la Loire
                '93': 19, // Provence-Alpes-Côte d'Azur
              },
            },
            {
              nom: 'Réseaux de chaleur décarbonés',
              pourcentagesRegionaux: {
                '84': 38, // Auvergne-Rhône-Alpes
                '27': 35, // Bourgogne-Franche-Comté
                '53': 17, // Bretagne
                '24': 20, // Centre-Val de Loire
                '94': 0, // Corse
                '44': 53, // Grand Est
                '32': 31, // Hauts-de-France
                '11': 113, // Île-de-France
                '28': 26, // Normandie
                '75': 10, // Nouvelle-Aquitaine
                '76': 7, // Occitanie
                '52': 16, // Pays de la Loire
                '93': 8, // Provence-Alpes-Côte d'Azur
              },
            },
          ],
        },
      ],
    };

  constructor(
    private readonly collectiviteService: ListCollectivitesService,
    private readonly permissionService: PermissionService,
    private readonly indicateursService: CrudValeursService,
    private readonly listIndicateursDefinitionsService: ListDefinitionsService,
    private readonly trajectoiresDataService: TrajectoiresDataService
  ) {}

  /**
   * Calcule les leviers pour une région donnée
   */
  async getData(
    input: GetMondrianLeviersDataRequest,
    user: AuthUser
  ): Promise<GetMondrianLeviersDataResponse> {
    this.logger.log(
      `Get mondrian leviers input data for collectivite: ${input.collectiviteId}`
    );

    const collectivite =
      await this.collectiviteService.getCollectiviteByAnyIdentifiant(input);
    if (collectivite.type !== 'epci') {
      throw new BadRequestException(
        'La collectivité doit être un EPCI pour récupérer les données du mondrian'
      );
    }
    this.logger.log(
      `La collectivité ${collectivite.id} (${collectivite.nom}) appartient à la région ${collectivite.regionCode}`
    );

    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.VISITE'],
      ResourceType.COLLECTIVITE,
      collectivite.id
    );

    const getMondrianLeviersDataResponse: GetMondrianLeviersDataResponse = {
      sourcesResultats: [],
      identifiantManquants: [],
      secteurs: [],
    };

    const indicateursToFetch: string[] = [];
    this.MONDRIAN_LEVIERS_CONFIGURATION.secteurs.forEach((secteur) => {
      const secteurData: MondrianSecteur = {
        nom: secteur.nom,
        identifiants: secteur.identifiants,
        couleur: secteur.couleur,
        resultat2019: null,
        objectif2019: null,
        objectif2030: null,
        sousSecteurs: [],
        leviers: [],
      };
      indicateursToFetch.push(...secteur.identifiants);
      secteur.leviers.forEach((levier) => {
        indicateursToFetch.push(...(levier.sousSecteursIdentifiants || []));
        const pourcentageRegional =
          levier.pourcentagesRegionaux[`${collectivite.regionCode}`];
        if (isNil(pourcentageRegional)) {
          // Not supposed to happen
          throw new InternalServerErrorException(
            `Pourcentage régional non trouvé pour le levier ${levier.nom} dans la région ${collectivite.regionCode}`
          );
        }
        const levierData: MondrianLevier = {
          nom: levier.nom,
          sousSecteursIdentifiants: levier.sousSecteursIdentifiants
            ? [...levier.sousSecteursIdentifiants]
            : undefined,
          pourcentageRegional: pourcentageRegional,
          objectifReduction: null,
        };
        secteurData.leviers.push(levierData);
      });
      getMondrianLeviersDataResponse.secteurs.push(secteurData);
    });

    this.logger.log(
      `Indicateurs à récupérer: ${indicateursToFetch.join(', ')}`
    );

    // On récupère les valeurs plutôt que la trajectoire car on a uniquement besoin des objectifs d'émission et de séquestration pour l'année 2030 (pas les autres dates, pas les consommations)
    this.logger.log(
      `Récupération des indicateurs de la trajectoire de la collectivité ${input.collectiviteId} (source SNBC)`
    );
    const indicateurValeursObjectifs2030 =
      await this.indicateursService.getIndicateurValeursGroupees(
        {
          collectiviteId: collectivite.id,
          identifiantsReferentiel: indicateursToFetch,
          sources: [this.trajectoiresDataService.SNBC_SOURCE.id],
          dateDebut: `${this.TARGET_YEAR}-01-01`,
          dateFin: `${this.TARGET_YEAR}-12-31`,
        },
        user
      );

    // Remplit les secteurs avec les objectifs 2030
    this.fillData(
      getMondrianLeviersDataResponse,
      indicateurValeursObjectifs2030,
      [this.trajectoiresDataService.SNBC_SOURCE.id],
      'objectif',
      'objectif2030'
    );

    const indicateurValeursObjectifs2019 =
      await this.indicateursService.getIndicateurValeursGroupees(
        {
          collectiviteId: collectivite.id,
          identifiantsReferentiel: indicateursToFetch,
          sources: [this.trajectoiresDataService.SNBC_SOURCE.id],
          dateDebut: `${this.REFERENCE_YEAR}-01-01`,
          dateFin: `${this.REFERENCE_YEAR}-12-31`,
        },
        user
      );

    // Remplit les secteurs avec les objectifs 2019
    this.fillData(
      getMondrianLeviersDataResponse,
      indicateurValeursObjectifs2019,
      [this.trajectoiresDataService.SNBC_SOURCE.id],
      'objectif',
      'objectif2019'
    );

    // On peut extraire la source de données utilisée pour calculer la trajectoire
    for (const indicateur of indicateurValeursObjectifs2030.indicateurs) {
      const valeurs =
        indicateur.sources[this.trajectoiresDataService.SNBC_SOURCE.id]
          ?.valeurs;
      if (valeurs?.length) {
        const firstValeurWithCommentaire = valeurs.find(
          (v) => v.objectifCommentaire
        );
        if (firstValeurWithCommentaire) {
          const extractedTrajectoireSource =
            this.trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
              firstValeurWithCommentaire?.objectifCommentaire || ''
            );
          if (!extractedTrajectoireSource) {
            throw new InternalServerErrorException(
              `Impossible d'extraire les sources de données utilisées pour calculer la trajectoire de la collectivité ${input.collectiviteId} à partir du comentaire ${firstValeurWithCommentaire?.objectifCommentaire}`
            );
          }
          getMondrianLeviersDataResponse.sourcesResultats =
            extractedTrajectoireSource.sources;
          this.logger.log(
            `La trajectoire de la collectivite ${
              input.collectiviteId
            } a été calculée à partir des sources suivantes: ${extractedTrajectoireSource?.sources.join(
              ', '
            )}`
          );
          break;
        }
      }
    }

    // Maintenant on récupère les valeurs résultats pour ces sources
    const indicateurValeursResultats2019 =
      await this.indicateursService.getIndicateurValeursGroupees(
        {
          collectiviteId: collectivite.id,
          identifiantsReferentiel: indicateursToFetch,
          sources: getMondrianLeviersDataResponse.sourcesResultats,
          dateDebut: `${this.REFERENCE_YEAR}-01-01`,
          dateFin: `${this.REFERENCE_YEAR}-12-31`,
        },
        user
      );

    // Remplit les secteurs avec les objectifs 2019
    this.fillData(
      getMondrianLeviersDataResponse,
      indicateurValeursResultats2019,
      getMondrianLeviersDataResponse.sourcesResultats,
      'resultat',
      'resultat2019'
    );

    this.computeObjectifReduction(getMondrianLeviersDataResponse);

    return getMondrianLeviersDataResponse;
  }

  private fillData(
    getMondrianLeviersDataResponse: GetMondrianLeviersDataResponse,
    indicateurValeurs: GetIndicateursValeursResponseType,
    sourcesByPriority: string[],
    indicateurProperty: 'objectif' | 'resultat',
    propertyToBeFilled: 'resultat2019' | 'objectif2019' | 'objectif2030'
  ) {
    getMondrianLeviersDataResponse.secteurs.forEach((secteur) => {
      secteur.identifiants.forEach((identifiant) => {
        const indicateur = indicateurValeurs.indicateurs.find(
          (ind) => ind.definition.identifiantReferentiel === identifiant
        );
        if (!indicateur) {
          // Ajoute en tant que missing indicateur
          if (
            !getMondrianLeviersDataResponse.identifiantManquants.includes(
              identifiant
            )
          ) {
            getMondrianLeviersDataResponse.identifiantManquants.push(
              identifiant
            );
          }
        } else {
          let valeur: IndicateurValeurGroupee | null = null;
          for (const source of sourcesByPriority) {
            valeur =
              indicateur.sources[source]?.valeurs?.find(
                (valeur) => !isNil(valeur[indicateurProperty])
              ) || null;
            if (valeur) {
              break;
            }
          }

          if (!valeur) {
            if (
              !getMondrianLeviersDataResponse.identifiantManquants.includes(
                identifiant
              )
            ) {
              getMondrianLeviersDataResponse.identifiantManquants.push(
                identifiant
              );
            }
          } else {
            const facteur =
              this.trajectoiresDataService.signeInversionSequestration(
                identifiant
              )
                ? -1
                : 1;
            secteur[propertyToBeFilled] =
              (secteur[propertyToBeFilled] || 0) +
              valeur[indicateurProperty]! * facteur;
          }

          // On ajoute les sous-secteurs du secteur
          secteur.leviers.forEach((levier) => {
            if (levier.sousSecteursIdentifiants) {
              levier.sousSecteursIdentifiants.forEach(
                (sousSecteurIdentifiant) => {
                  let sousSecteur: MondrianSousSecteur | undefined =
                    secteur.sousSecteurs.find(
                      (sousSecteur) =>
                        sousSecteur.identifiant === sousSecteurIdentifiant
                    );
                  if (!sousSecteur) {
                    sousSecteur = {
                      nom: '',
                      identifiant: sousSecteurIdentifiant,
                      resultat2019: null,
                      objectif2019: null,
                      objectif2030: null,
                    };
                    secteur.sousSecteurs.push(sousSecteur);
                  }
                  const sousSecteurIndicateur =
                    indicateurValeurs.indicateurs.find(
                      (ind) =>
                        ind.definition.identifiantReferentiel ===
                        sousSecteurIdentifiant
                    );
                  if (!sousSecteurIndicateur) {
                    if (
                      !getMondrianLeviersDataResponse.identifiantManquants.includes(
                        sousSecteurIdentifiant
                      )
                    ) {
                      getMondrianLeviersDataResponse.identifiantManquants.push(
                        sousSecteurIdentifiant
                      );
                    }
                  } else {
                    sousSecteur.nom = sousSecteurIndicateur.definition.titre;

                    let sousSecteurValeur: IndicateurValeurGroupee | null =
                      null;
                    for (const source of sourcesByPriority) {
                      sousSecteurValeur =
                        sousSecteurIndicateur.sources[source]?.valeurs?.find(
                          (valeur) => !isNil(valeur[indicateurProperty])
                        ) || null;
                      if (valeur) {
                        break;
                      }
                    }
                    if (!sousSecteurValeur) {
                      if (
                        !getMondrianLeviersDataResponse.identifiantManquants.includes(
                          sousSecteurIdentifiant
                        )
                      ) {
                        getMondrianLeviersDataResponse.identifiantManquants.push(
                          sousSecteurIdentifiant
                        );
                      }
                    } else {
                      this.logger.log(
                        `Sous-secteur ${sousSecteurIdentifiant} a une valeur pour ${indicateurProperty} (propertyToBeFilled: ${propertyToBeFilled}) ${sousSecteurValeur[indicateurProperty]}`
                      );
                      const facteur =
                        this.trajectoiresDataService.signeInversionSequestration(
                          sousSecteurIdentifiant
                        )
                          ? -1
                          : 1;
                      sousSecteur[propertyToBeFilled] =
                        (sousSecteur[propertyToBeFilled] || 0) +
                        sousSecteurValeur[indicateurProperty]! * facteur;
                    }
                  }
                }
              );
            }
          });
        }
      });
    });
  }

  private computeObjectifReduction(
    getMondrianLeviersDataResponse: GetMondrianLeviersDataResponse
  ) {
    getMondrianLeviersDataResponse.secteurs.forEach((secteur) => {
      secteur.leviers.forEach((levier) => {
        if (!levier.sousSecteursIdentifiants) {
          const valeur2019 = !isNil(secteur.resultat2019)
            ? secteur.resultat2019
            : secteur.objectif2019;
          if (!isNil(secteur.objectif2030) && !isNil(valeur2019)) {
            levier.objectifReduction = roundTo(
              ((secteur.objectif2030 - valeur2019) *
                levier.pourcentageRegional) /
                100,
              2
            );
          }
        } else {
          let valeurTotal2019: number | null = null;
          let objectifTotal2030: number | null = null;
          levier.sousSecteursIdentifiants.forEach((sousSecteurIdentifiant) => {
            const sousSecteur = secteur.sousSecteurs.find(
              (sousSecteur) =>
                sousSecteur.identifiant === sousSecteurIdentifiant
            );
            if (sousSecteur) {
              const valeur2019 = !isNil(sousSecteur.resultat2019)
                ? sousSecteur.resultat2019
                : sousSecteur.objectif2019;
              if (!isNil(sousSecteur.objectif2030) && !isNil(valeur2019)) {
                valeurTotal2019 = (valeurTotal2019 || 0) + valeur2019;
                objectifTotal2030 =
                  (objectifTotal2030 || 0) + sousSecteur.objectif2030;
              }
            }
          });

          if (!isNil(objectifTotal2030) && !isNil(valeurTotal2019)) {
            levier.objectifReduction = roundTo(
              ((objectifTotal2030 - valeurTotal2019) *
                levier.pourcentageRegional) /
                100,
              2
            );
          }
        }
      });
    });
  }
}
