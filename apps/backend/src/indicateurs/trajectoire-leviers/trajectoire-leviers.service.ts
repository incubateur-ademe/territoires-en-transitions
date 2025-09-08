import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';

import { ListDefinitionsService } from '@/backend/indicateurs/list-definitions/list-definitions.service';
import { GetIndicateursValeursResponseType } from '@/backend/indicateurs/shared/models/get-indicateurs.response';
import { IndicateurValeurGroupee } from '@/backend/indicateurs/shared/models/indicateur-valeur.table';
import { GetTrajectoireLeviersDataRequest } from '@/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import {
  GetTrajectoireLeviersDataResponse,
  TrajectoireLevier,
  TrajectoireSecteur,
  TrajectoireSousSecteur,
} from '@/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.response';
import {
  RegionCode,
  TRAJECTOIRE_LEVIERS_CONFIGURATION,
} from '@/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.config';
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

@Injectable()
export class TrajectoireLeviersService {
  private readonly logger = new Logger(TrajectoireLeviersService.name);

  private readonly REFERENCE_YEAR = 2019;
  private readonly TARGET_YEAR = 2030;

  constructor(
    private readonly collectiviteService: ListCollectivitesService,
    private readonly permissionService: PermissionService,
    private readonly indicateursService: CrudValeursService,
    private readonly listIndicateursDefinitionsService: ListDefinitionsService,
    private readonly trajectoiresDataService: TrajectoiresDataService
  ) {}

  /*
  function getLeviersByRegion(leviers, regionCode): TrajectoireLevier[]{
    return leviers.map(levier => {
     const pourcentageRegional = levier.pourcentagesRegionaux[regionCode]
     
    return  {
      nom: levier.nom,
      sousSecteursIdentifiants: levier.sousSecteursIdentifiants ?? undefined,
      pourcentageRegional: pourcentageRegional,
      objectifReduction: null,
    }
    });
   formatSecteur(regionCode){
  return  this.TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs.map((secteur) => {
        const secteurData: TrajectoireSecteur = {
          nom: secteur.nom,
          identifiants: secteur.identifiants,
          couleur: secteur.couleur,
          resultat2019: null,
          objectif2019: null,
          objectif2030: null,
          sousSecteurs: [],
          leviers: getLeviersByRegion(secteur.leviers, regionCode),
        };
        
      });
  }*/

  async getData(
    input: GetTrajectoireLeviersDataRequest,
    user: AuthUser
  ): Promise<GetTrajectoireLeviersDataResponse> {
    this.logger.log(
      `Get trajectoire leviers input data for collectivite: ${input.collectiviteId}`
    );

    const collectivite =
      await this.collectiviteService.getCollectiviteByAnyIdentifiant(input);
    if (collectivite.type !== 'epci') {
      throw new BadRequestException(
        'La collectivité doit être un EPCI pour récupérer les données de trajectoire leviers'
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

    const getTrajectoireLeviersDataResponse: GetTrajectoireLeviersDataResponse =
      {
        sourcesResultats: [],
        identifiantManquants: [],
        secteurs: [],
      };

    const indicateursToFetch: string[] =
      TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs
        .map((secteur) => [
          ...secteur.identifiants,
          ...secteur.leviers.map(
            (levier) => levier.sousSecteursIdentifiants || []
          ),
        ])
        .flat(2);

    TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs.forEach((secteur) => {
      const secteurData: TrajectoireSecteur = {
        nom: secteur.nom,
        identifiants: secteur.identifiants,
        couleur: secteur.couleur,
        resultat2019: null,
        objectif2019: null,
        objectif2030: null,
        sousSecteurs: [],
        leviers: [],
      };
      secteur.leviers.forEach((levier) => {
        const pourcentageRegional =
          levier.pourcentagesRegionaux[
            `${collectivite.regionCode}` as RegionCode
          ];
        if (isNil(pourcentageRegional)) {
          // Not supposed to happen
          throw new InternalServerErrorException(
            `Pourcentage régional non trouvé pour le levier ${levier.nom} dans la région ${collectivite.regionCode}`
          );
        }
        const levierData: TrajectoireLevier = {
          nom: levier.nom,
          sousSecteursIdentifiants: levier.sousSecteursIdentifiants
            ? [...levier.sousSecteursIdentifiants]
            : undefined,
          pourcentageRegional: pourcentageRegional,
          objectifReduction: null,
        };
        secteurData.leviers.push(levierData);
      });
      getTrajectoireLeviersDataResponse.secteurs.push(secteurData);
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
      getTrajectoireLeviersDataResponse,
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
      getTrajectoireLeviersDataResponse,
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
          getTrajectoireLeviersDataResponse.sourcesResultats =
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
          sources: getTrajectoireLeviersDataResponse.sourcesResultats,
          dateDebut: `${this.REFERENCE_YEAR}-01-01`,
          dateFin: `${this.REFERENCE_YEAR}-12-31`,
        },
        user
      );

    // Remplit les secteurs avec les objectifs 2019
    this.fillData(
      getTrajectoireLeviersDataResponse,
      indicateurValeursResultats2019,
      getTrajectoireLeviersDataResponse.sourcesResultats,
      'resultat',
      'resultat2019'
    );

    this.computeObjectifReduction(getTrajectoireLeviersDataResponse);

    return getTrajectoireLeviersDataResponse;
  }

  private fillData(
    getTrajectoireLeviersDataResponse: GetTrajectoireLeviersDataResponse,
    indicateurValeurs: GetIndicateursValeursResponseType,
    sourcesByPriority: string[],
    indicateurProperty: 'objectif' | 'resultat',
    propertyToBeFilled: 'resultat2019' | 'objectif2019' | 'objectif2030'
  ) {
    getTrajectoireLeviersDataResponse.secteurs.forEach((secteur) => {
      secteur.identifiants.forEach((identifiant) => {
        const indicateur = indicateurValeurs.indicateurs.find(
          (ind) => ind.definition.identifiantReferentiel === identifiant
        );
        if (!indicateur) {
          // Ajoute en tant que missing indicateur
          if (
            !getTrajectoireLeviersDataResponse.identifiantManquants.includes(
              identifiant
            )
          ) {
            getTrajectoireLeviersDataResponse.identifiantManquants.push(
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
              !getTrajectoireLeviersDataResponse.identifiantManquants.includes(
                identifiant
              )
            ) {
              getTrajectoireLeviersDataResponse.identifiantManquants.push(
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
                  let sousSecteur: TrajectoireSousSecteur | undefined =
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
                      !getTrajectoireLeviersDataResponse.identifiantManquants.includes(
                        sousSecteurIdentifiant
                      )
                    ) {
                      getTrajectoireLeviersDataResponse.identifiantManquants.push(
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
                        !getTrajectoireLeviersDataResponse.identifiantManquants.includes(
                          sousSecteurIdentifiant
                        )
                      ) {
                        getTrajectoireLeviersDataResponse.identifiantManquants.push(
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
    getTrajectoireLeviersDataResponse: GetTrajectoireLeviersDataResponse
  ) {
    getTrajectoireLeviersDataResponse.secteurs.forEach((secteur) => {
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
