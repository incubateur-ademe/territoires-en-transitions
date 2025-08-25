import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';

import { IndicateurDefinitionDetaillee } from '@/backend/indicateurs/list-definitions/list-definitions.response';
import { ListDefinitionsService } from '@/backend/indicateurs/list-definitions/list-definitions.service';
import { GetMondrianLeviersDataRequest } from '@/backend/indicateurs/mondrian/get-mondrian-leviers-data.request';
import {
  GetMondrianLeviersDataResponse,
  MondrianLevier,
  MondrianSecteur,
  MondrianSousSecteur,
} from '@/backend/indicateurs/mondrian/get-mondrian-leviers-data.response';
import TrajectoiresDataService from '@/backend/indicateurs/trajectoires/trajectoires-data.service';
import CrudValeursService from '@/backend/indicateurs/valeurs/crud-valeurs.service';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
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

  private readonly MONDRIAN_LEVIERS_CONFIGURATION: MondrianLeviersRegionConfiguration =
    {
      secteurs: [
        {
          nom: 'Résidentiel',
          identifiant: 'cae_1.c',
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
          identifiant: 'cae_1.d',
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
          identifiant: 'cae_1.k',
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
          nom: 'Agriculture',
          identifiant: 'cae_1.g',
          leviers: [
            {
              nom: 'Bâtiments & Machines agricoles',
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
          identifiant: 'cae_1.h',
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
          ],
        },
        {
          nom: 'UTCATF',
          identifiant: 'cae_63.a',
          leviers: [
            {
              nom: 'Gestion des forêts et produits bois',
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
              nom: 'Gestion des prairies',
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
          nom: 'Branche énergie',
          identifiant: 'cae_1.j',
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

  private readonly SOURCE_INDICATEURS: string[] = [
    'cae_1.c',
    'cae_1.ca',
    'cae_1.cb',
    'cae_1.cc',
    'cae_1.d',
    'cae_1.da',
    'cae_1.db',
    'cae_1.i',
    'cae_1.ia',
    'cae_1.ib',
    'cae_1.ic',
    'cae_1.id',
    'cae_1.ie',
    'cae_1.if',
    'cae_1.ig',
    'cae_1.g',
    'cae_1.ga',
    'cae_1.gb',
    'cae_1.gc',
    'cae_1.k',
    'cae_1.ea',
    'cae_1.eb',
    'cae_1.f',
    'cae_1.h',
    'cae_1.j',
    'cae_63.a',
    'cae_63.b',
    'cae_63.ca',
    'cae_63.cb',
    'cae_63.da',
    'cae_63.db',
    'cae_63.e',
    'cae_1.csc',
  ];

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
  ): Promise<any> {
    // GetMondrianLeviersDataResponse
    this.logger.log(
      `Get mondrian leviers input data for collectivite: ${input.collectiviteId}`
    );

    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['INDICATEURS.VISITE'],
      ResourceType.COLLECTIVITE,
      input.collectiviteId
    );

    const collectivite = await this.collectiviteService.getCollectiviteById(
      input.collectiviteId
    );
    if (collectivite.type !== 'epci') {
      throw new BadRequestException(
        'La collectivité doit être un EPCI pour récupérer les données du mondrian'
      );
    }
    this.logger.log(
      `La collectivité ${collectivite.id} (${collectivite.nom}) appartient à la région ${collectivite.regionCode}`
    );

    const getMondrianLeviersDataResponse: GetMondrianLeviersDataResponse = {
      sourcesResultats: [],
      identifiantManquants: [],
      secteurs: [],
    };
    this.MONDRIAN_LEVIERS_CONFIGURATION.secteurs.forEach((secteur) => {
      const secteurData: MondrianSecteur = {
        nom: '',
        identifiant: secteur.identifiant,
        couleur: secteur.couleur,
        resultat2019: null,
        objectif2030: null,
        sousSecteurs: [],
        leviers: [],
      };
      secteur.leviers.forEach((levier) => {
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
          pourcentageRegional: pourcentageRegional,
        };
        secteurData.leviers.push(levierData);
      });
      getMondrianLeviersDataResponse.secteurs.push(secteurData);
    });

    // On récupère les valeurs plutôt que la trajectoire car on a uniquement besoin des objectifs d'émission et de séquestration pour l'année 2030 (pas les autres dates, pas les consommations)
    this.logger.log(
      `Récupération des indicateurs de la trajectoire de la collectivité ${input.collectiviteId} (source SNBC)`
    );
    const indicateurValeursObjectifs =
      await this.indicateursService.getIndicateurValeursGroupees(
        {
          collectiviteId: input.collectiviteId,
          identifiantsReferentiel: this.SOURCE_INDICATEURS,
          sources: [this.trajectoiresDataService.SNBC_SOURCE.id],
          dateDebut: '2030-01-01',
          dateFin: '2030-12-31',
        },
        user
      );

    // Remplit les secteurs avec les objectifs 2030
    getMondrianLeviersDataResponse.secteurs.forEach((secteur) => {
      const indicateur = indicateurValeursObjectifs.indicateurs.find(
        (ind) => ind.definition.identifiantReferentiel === secteur.identifiant
      );
      if (!indicateur) {
        // Ajoute en tant que missing indicateur
        getMondrianLeviersDataResponse.identifiantManquants.push(
          secteur.identifiant
        );
      } else {
        secteur.nom =
          this.listIndicateursDefinitionsService.getSecteurName(
            indicateur.definition as IndicateurDefinitionDetaillee
          ) || secteur.nom;
        const objectif = indicateur.sources[
          this.trajectoiresDataService.SNBC_SOURCE.id
        ].valeurs?.find((valeur) => !isNil(valeur.objectif));
        if (!objectif) {
          getMondrianLeviersDataResponse.identifiantManquants.push(
            secteur.identifiant
          );
        }
        secteur.objectif2030 = objectif?.objectif || null;

        // On idenfitie tous les sous-secteurs du secteur
        indicateurValeursObjectifs.indicateurs.forEach((ind) => {
          const sousIndicateurDetaille =
            ind.definition as IndicateurDefinitionDetaillee;

          const sousIndicateurSecteur =
            this.listIndicateursDefinitionsService.getSecteurName(
              sousIndicateurDetaille
            );
          if (
            sousIndicateurDetaille.identifiantReferentiel &&
            sousIndicateurSecteur === secteur.nom
          ) {
            const sousSecteur =
              this.listIndicateursDefinitionsService.getSousSecteurName(
                sousIndicateurDetaille
              );
            this.logger.log(
              `Sous-secteur ${sousSecteur} du secteur ${secteur.identifiant}`
            );
            if (sousSecteur) {
              const sousSecteurObjectif = ind.sources[
                this.trajectoiresDataService.SNBC_SOURCE.id
              ]?.valeurs?.find((valeur) => !isNil(valeur.objectif));
              if (!sousSecteurObjectif) {
                getMondrianLeviersDataResponse.identifiantManquants.push(
                  sousIndicateurDetaille.identifiantReferentiel
                );
              }
              const sousSecteurData: MondrianSousSecteur = {
                nom: sousSecteur || '',
                identifiant: sousIndicateurDetaille.identifiantReferentiel,
                resultat2019: null,
                objectif2030: sousSecteurObjectif?.objectif || null,
              };
              secteur.sousSecteurs.push(sousSecteurData);
            }
          }
        });
      }
    });

    // On peut extraire la source de données utilisée pour calculer la trajectoire
    for (const indicateur of indicateurValeursObjectifs.indicateurs) {
      const valeurs =
        indicateur.sources[this.trajectoiresDataService.SNBC_SOURCE.id].valeurs;
      if (valeurs.length) {
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
    const indicateurValeursResultats =
      await this.indicateursService.getIndicateurValeursGroupees(
        {
          collectiviteId: input.collectiviteId,
          identifiantsReferentiel: this.SOURCE_INDICATEURS,
          sources: getMondrianLeviersDataResponse.sourcesResultats,
        },
        user
      );

    return getMondrianLeviersDataResponse;
  }
}
