import { Injectable, Logger } from '@nestjs/common';
import ListCollectivitesService from '@tet/backend/collectivites/list-collectivites/list-collectivites.service';
import { GetTrajectoireLeviersDataRequest } from '@tet/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import {
  GetTrajectoireLeviersDataResponse,
  TrajectoireData,
  TrajectoireLevier,
  TrajectoireSecteur,
} from '@tet/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.response';
import {
  isRegionSupportee,
  LevierConfiguration,
  RegionCode,
  SecteurConfiguration,
  TRAJECTOIRE_LEVIERS_CONFIGURATION,
  TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
} from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.config';
import { TrajectoireSnbc3FeatureFlagService } from '@tet/backend/indicateurs/trajectoires/trajectoire-snbc3-feature-flag.service';
import TrajectoiresDataService from '@tet/backend/indicateurs/trajectoires/trajectoires-data.service';
import ManageIndicateurValeursService from '@tet/backend/indicateurs/valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { GetIndicateursValeursResponse } from '@tet/backend/indicateurs/valeurs/list-indicateur-valeurs/get-indicateur-valeurs.response';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CollectivitePublic } from '@tet/domain/collectivites';
import {
  ANNEE_REFERENCE_SNBC_V3,
  getStatutTrajectoireSnbc3,
  IndicateurSourceEnum,
  StatutTrajectoireSnbc3,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { isNil, round, sum, sumBy } from 'es-toolkit';
import {
  TrajectoireLeviersError,
  TrajectoireLeviersErrorEnum,
} from './trajectoire-leviers.errors';

/** Valeurs lues pour une collectivité, communes aux secteurs et sous-secteurs. */
type LeviersValeurs = {
  /** Source de la trajectoire : `snbc`, ou `snbc3` avec le flag. */
  trajectoireSourceId: string;
  objectifsCible: GetIndicateursValeursResponse;
  objectifsReference: GetIndicateursValeursResponse;
  /**
   * Émissions observées de l'année de référence. `null` dans le chemin
   * SNBC 3 : la base est alors l'objectif de l'année de référence.
   */
  resultatsReference: GetIndicateursValeursResponse | null;
  resultatSourcesByPriority: string[];
};

@Injectable()
export class TrajectoireLeviersService {
  private readonly logger = new Logger(TrajectoireLeviersService.name);

  private readonly REFERENCE_YEAR = 2019;
  private readonly TARGET_YEAR = 2030;

  constructor(
    private readonly collectiviteService: ListCollectivitesService,
    private readonly permissionService: PermissionService,
    private readonly indicateursService: ManageIndicateurValeursService,
    private readonly trajectoiresDataService: TrajectoiresDataService,
    private readonly trajectoireSnbc3FeatureFlag: TrajectoireSnbc3FeatureFlagService
  ) {}

  private getLeviersByRegion(
    leviers: LevierConfiguration[],
    regionCode: RegionCode
  ): TrajectoireLevier[] {
    return leviers.map((levier) => {
      const pourcentageRegional = levier.pourcentagesRegionaux[regionCode];

      return {
        nom: levier.nom,
        sousSecteursIdentifiants: levier.sousSecteursIdentifiants
          ? [...levier.sousSecteursIdentifiants]
          : undefined,
        pourcentageRegional: pourcentageRegional,
        objectifReduction: null,
      };
    });
  }

  private getTrajectoireObjectifOrResultatForIdentifiant(
    identifiant: string,
    indicateurValeurs: GetIndicateursValeursResponse,
    valeurType: 'objectif' | 'resultat',
    sourcesByPriority: string[]
  ): number | null {
    const indicateurValeursParSource = indicateurValeurs.indicateurs.find(
      (ind) => ind.definition.identifiantReferentiel === identifiant
    )?.sources;

    const valeurParSource = sourcesByPriority.map((source) => {
      const firstNotNullValeur = indicateurValeursParSource?.[
        source
      ]?.valeurs?.find((valeur) => !isNil(valeur[valeurType]));
      if (!firstNotNullValeur || isNil(firstNotNullValeur[valeurType])) {
        return null;
      }
      const facteur = this.trajectoiresDataService.signeInversionSequestration(
        identifiant
      )
        ? -1
        : 1;
      return firstNotNullValeur[valeurType] * facteur;
    });

    // On retourne la première valeur non nulle
    const firstNotNullValeur = valeurParSource.find((valeur) => !isNil(valeur));
    return !isNil(firstNotNullValeur) ? firstNotNullValeur : null;
  }

  private getTrajectoireDataForIdentifiants(
    identifiants: string[],
    valeurs: LeviersValeurs
  ): {
    data: TrajectoireData;
    identifiantManquants: string[];
  } {
    const { trajectoireSourceId, resultatsReference } = valeurs;
    const objectifs2030 = identifiants.map((identifiant) =>
      this.getTrajectoireObjectifOrResultatForIdentifiant(
        identifiant,
        valeurs.objectifsCible,
        'objectif',
        [trajectoireSourceId]
      )
    );
    const objectifs2019 = identifiants.map((identifiant) =>
      this.getTrajectoireObjectifOrResultatForIdentifiant(
        identifiant,
        valeurs.objectifsReference,
        'objectif',
        [trajectoireSourceId]
      )
    );
    const resultats2019 = identifiants.map((identifiant) =>
      resultatsReference
        ? this.getTrajectoireObjectifOrResultatForIdentifiant(
            identifiant,
            resultatsReference,
            'resultat',
            valeurs.resultatSourcesByPriority
          )
        : null
    );

    const identifiantsWithMissingData = identifiants.filter(
      (identifiant, index) =>
        (resultatsReference !== null && isNil(resultats2019[index])) ||
        isNil(objectifs2019[index]) ||
        isNil(objectifs2030[index])
    );

    const data: TrajectoireData = {
      resultat2019: resultats2019.some((valeur) => isNil(valeur))
        ? null
        : sum(resultats2019 as number[]),
      objectif2019: objectifs2019.some((valeur) => isNil(valeur))
        ? null
        : sum(objectifs2019 as number[]),
      objectif2030: objectifs2030.some((valeur) => isNil(valeur))
        ? null
        : sum(objectifs2030 as number[]),
    };
    return {
      data,
      identifiantManquants: identifiantsWithMissingData,
    };
  }

  private getSecteurData(
    secteur: SecteurConfiguration,
    regionCode: RegionCode,
    valeurs: LeviersValeurs
  ): {
    secteurData: TrajectoireSecteur;
    identifiantManquants: string[];
  } {
    const { data, identifiantManquants: secteurIdentifiantManquants } =
      this.getTrajectoireDataForIdentifiants(secteur.identifiants, valeurs);

    const neededSousSecteurs = secteur.leviers.reduce((acc, levier) => {
      if (levier.sousSecteursIdentifiants) {
        return [...new Set([...acc, ...levier.sousSecteursIdentifiants])];
      }
      return acc;
    }, [] as string[]);

    const neededSousSecteursData = neededSousSecteurs.map((sousSecteur) => ({
      identifiant: sousSecteur,
      ...this.getTrajectoireDataForIdentifiants([sousSecteur], valeurs),
    }));

    const allIdentifiantManquants = [
      ...new Set([
        ...secteurIdentifiantManquants,
        ...neededSousSecteursData.flatMap((data) => data.identifiantManquants),
      ]),
    ];

    const secteurData: TrajectoireSecteur = {
      nom: secteur.nom,
      identifiants: secteur.identifiants,
      couleur: secteur.couleur,
      ...data,
      sousSecteurs: neededSousSecteursData.map((data) => ({
        nom:
          valeurs.objectifsCible.indicateurs.find(
            (ind) => ind.definition.identifiantReferentiel === data.identifiant
          )?.definition.titre || '',
        identifiant: data.identifiant,
        ...data.data,
      })),
      leviers: this.getLeviersByRegion(secteur.leviers, regionCode),
    };
    return {
      secteurData,
      identifiantManquants: allIdentifiantManquants,
    };
  }

  private hasSourceValeurs(
    indicateurValeurs: GetIndicateursValeursResponse,
    sourceId: string
  ): boolean {
    return indicateurValeurs.indicateurs.some(
      (indicateur) => (indicateur.sources[sourceId]?.valeurs?.length ?? 0) > 0
    );
  }

  private extractTrajectoireSource(
    indicateurValeurs: GetIndicateursValeursResponse
  ): Result<string[], TrajectoireLeviersError> {
    const indicateurValeursSnbcFlat = indicateurValeurs.indicateurs
      .filter(
        (indicateur) =>
          indicateur.sources[this.trajectoiresDataService.SNBC_SOURCE.id]
            ?.valeurs?.length
      )
      .map(
        (indicateur) =>
          indicateur.sources[this.trajectoiresDataService.SNBC_SOURCE.id]
            .valeurs
      )
      .flat();
    const firstValeurWithCommentaire = indicateurValeursSnbcFlat.find(
      (v) => v.objectifCommentaire
    );
    const extractedTrajectoireSource =
      firstValeurWithCommentaire?.objectifCommentaire
        ? this.trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
            firstValeurWithCommentaire.objectifCommentaire
          )
        : null;
    if (!extractedTrajectoireSource) {
      this.logger.error(
        `Impossible d'extraire les sources de données utilisées pour calculer la trajectoire de la collectivité à partir du comentaire ${firstValeurWithCommentaire?.objectifCommentaire}`
      );
      return failure(
        TrajectoireLeviersErrorEnum.TRAJECTOIRE_SOURCES_NOT_EXTRACTABLE
      );
    }
    return success(extractedTrajectoireSource.sources);
  }

  async getData(
    input: GetTrajectoireLeviersDataRequest,
    user: AuthUser
  ): Promise<
    Result<GetTrajectoireLeviersDataResponse, TrajectoireLeviersError>
  > {
    this.logger.log(
      `Get trajectoire leviers input data for collectivite: ${input.collectiviteId}`
    );

    const collectivite =
      await this.collectiviteService.getCollectiviteByAnyIdentifiant(input);

    if (
      await this.trajectoireSnbc3FeatureFlag.isTrajectoireSnbc3Enabled(
        user,
        collectivite.id
      )
    ) {
      return this.getDataSnbc3(collectivite, user);
    }

    if (collectivite.type !== 'epci' && collectivite.type !== 'test') {
      return failure(TrajectoireLeviersErrorEnum.COLLECTIVITE_NOT_EPCI);
    }
    input.collectiviteId = collectivite.id;
    this.logger.log(
      `La collectivité ${collectivite.id} (${collectivite.nom}) appartient à la région ${collectivite.regionCode}`
    );

    const permission = await this.permissionService.isAllowed(
      user,
      'indicateurs.valeurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId: collectivite.id }
    );
    if (!permission.success) {
      return failure(TrajectoireLeviersErrorEnum.UNAUTHORIZED);
    }

    const getTrajectoireLeviersDataResponse: GetTrajectoireLeviersDataResponse =
      {
        sourcesResultats: [],
        identifiantManquants: [],
        secteurs: [],
      };

    this.logger.log(
      `Indicateurs à récupérer: ${TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS.join(
        ', '
      )}`
    );

    // On récupère les valeurs plutôt que la trajectoire car on a uniquement besoin des objectifs d'émission et de séquestration pour l'année 2030 (pas les autres dates, pas les consommations)
    this.logger.log(
      `Récupération des indicateurs de la trajectoire de la collectivité ${input.collectiviteId} (source SNBC)`
    );
    const indicateurValeursObjectifs2030 =
      await this.indicateursService.listIndicateurValeurs(
        {
          periodicite: 'annuelle',
          collectiviteId: collectivite.id,
          identifiantsReferentiel: TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
          sources: [this.trajectoiresDataService.SNBC_SOURCE.id],
          dateDebut: `${this.TARGET_YEAR}-01-01`,
          dateFin: `${this.TARGET_YEAR}-12-31`,
        },
        { user }
      );

    const indicateurValeursObjectifs2019 =
      await this.indicateursService.listIndicateurValeurs(
        {
          periodicite: 'annuelle',
          collectiviteId: collectivite.id,
          identifiantsReferentiel: TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
          sources: [this.trajectoiresDataService.SNBC_SOURCE.id],
          dateDebut: `${this.REFERENCE_YEAR}-01-01`,
          dateFin: `${this.REFERENCE_YEAR}-12-31`,
        },
        { user }
      );

    const isTrajectoireComputed = this.hasSourceValeurs(
      indicateurValeursObjectifs2030,
      this.trajectoiresDataService.SNBC_SOURCE.id
    );
    if (!isTrajectoireComputed) {
      return failure(TrajectoireLeviersErrorEnum.TRAJECTOIRE_NOT_COMPUTED);
    }

    // On peut extraire la source de données utilisée pour calculer la trajectoire
    const trajectoireSourceResult = this.extractTrajectoireSource(
      indicateurValeursObjectifs2030
    );
    if (!trajectoireSourceResult.success) {
      return trajectoireSourceResult;
    }
    getTrajectoireLeviersDataResponse.sourcesResultats =
      trajectoireSourceResult.data;

    this.logger.log(
      `La trajectoire de la collectivite ${
        collectivite.id
      } a été calculée à partir des sources suivantes: ${getTrajectoireLeviersDataResponse.sourcesResultats.join(
        ', '
      )}`
    );

    // Maintenant on récupère les valeurs résultats pour ces sources
    const indicateurValeursResultats2019 =
      await this.indicateursService.listIndicateurValeurs(
        {
          periodicite: 'annuelle',
          collectiviteId: collectivite.id,
          identifiantsReferentiel: TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
          sources: getTrajectoireLeviersDataResponse.sourcesResultats,
          dateDebut: `${this.REFERENCE_YEAR}-01-01`,
          dateFin: `${this.REFERENCE_YEAR}-12-31`,
        },
        { user }
      );

    return success(
      this.buildResponse(
        `${collectivite.regionCode}` as RegionCode,
        {
          trajectoireSourceId: this.trajectoiresDataService.SNBC_SOURCE.id,
          objectifsCible: indicateurValeursObjectifs2030,
          objectifsReference: indicateurValeursObjectifs2019,
          resultatsReference: indicateurValeursResultats2019,
          resultatSourcesByPriority:
            getTrajectoireLeviersDataResponse.sourcesResultats,
        }
      )
    );
  }

  /**
   * Chemin SNBC 3 (avec le flag) : la base est la valeur `snbc3` de 2021. Le
   * recalage la fait déjà coïncider avec l'OREC 2021 : on ne lit ni les
   * émissions observées ni le commentaire des valeurs.
   *
   * Toute collectivité présente dans le millésime est acceptée, Paris compris.
   */
  private async getDataSnbc3(
    collectivite: CollectivitePublic,
    user: AuthUser
  ): Promise<
    Result<GetTrajectoireLeviersDataResponse, TrajectoireLeviersError>
  > {
    const permission = await this.permissionService.isAllowed(
      user,
      'indicateurs.valeurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId: collectivite.id }
    );
    if (!permission.success) {
      return failure(TrajectoireLeviersErrorEnum.UNAUTHORIZED);
    }

    const listObjectifs = (annee: number) =>
      this.indicateursService.listIndicateurValeurs(
        {
          periodicite: 'annuelle',
          collectiviteId: collectivite.id,
          identifiantsReferentiel: TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
          sources: [IndicateurSourceEnum.SNBC3],
          dateDebut: `${annee}-01-01`,
          dateFin: `${annee}-12-31`,
        },
        { user }
      );
    const [objectifsCible, objectifsReference] = await Promise.all([
      listObjectifs(this.TARGET_YEAR),
      listObjectifs(ANNEE_REFERENCE_SNBC_V3),
    ]);

    if (!this.hasSourceValeurs(objectifsCible, IndicateurSourceEnum.SNBC3)) {
      // Même règle que la page Trajectoire : seul un EPCI à fiscalité propre
      // ou un EPT absent du millésime attend une trajectoire. Les autres ne
      // sont pas couverts par la SNBC 3 : les communes (leur trajectoire est
      // celle de leur EPCI) et tout le reste, régions, départements,
      // syndicats, PETR… (maille supra).
      const statut = getStatutTrajectoireSnbc3({
        hasDroitsLecture: true,
        isInMillesime: false,
        collectivite,
      });
      return failure(
        statut === StatutTrajectoireSnbc3.ABSENT_DU_MILLESIME
          ? TrajectoireLeviersErrorEnum.TRAJECTOIRE_NON_DISPONIBLE
          : TrajectoireLeviersErrorEnum.COLLECTIVITE_NOT_EPCI
      );
    }
    if (!isRegionSupportee(collectivite.regionCode)) {
      return failure(TrajectoireLeviersErrorEnum.REGION_NON_SUPPORTEE);
    }

    return success(
      this.buildResponse(
        collectivite.regionCode,
        {
          trajectoireSourceId: IndicateurSourceEnum.SNBC3,
          objectifsCible,
          objectifsReference,
          resultatsReference: null,
          resultatSourcesByPriority: [],
        }
      )
    );
  }

  /** Affecte les données aux secteurs, puis calcule les réductions des leviers. */
  private buildResponse(
    regionCode: RegionCode,
    valeurs: LeviersValeurs
  ): GetTrajectoireLeviersDataResponse {
    const secteursData = TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs.map(
      (secteur) => this.getSecteurData(secteur, regionCode, valeurs)
    );
    const response: GetTrajectoireLeviersDataResponse = {
      sourcesResultats: valeurs.resultatSourcesByPriority,
      secteurs: secteursData.map((data) => data.secteurData),
      identifiantManquants: [
        ...new Set(secteursData.flatMap((data) => data.identifiantManquants)),
      ],
    };

    // On calcule les objectifs de réduction pour les leviers à partir des données des secteurs/sous-secteurs et des pourcentages régionaux
    this.computeObjectifReduction(response);
    return response;
  }

  private getObjectifReduction(
    pourcentageRegional: number,
    trajectoireData: TrajectoireData[]
  ): number | null {
    if (!trajectoireData.length) {
      return null;
    }

    if (trajectoireData.some((data) => isNil(data.objectif2030))) {
      return null;
    }

    const valeurs2019 = trajectoireData.map((data) =>
      !isNil(data.resultat2019) ? data.resultat2019 : data.objectif2019
    );
    if (valeurs2019.some((valeur) => isNil(valeur))) {
      return null;
    }

    const valeurTotal2019 = sum(valeurs2019 as number[]);
    const objectifTotal2030 = sumBy(
      trajectoireData,
      (data) => data.objectif2030 ?? 0
    );

    return round(
      ((objectifTotal2030 - valeurTotal2019) * pourcentageRegional) / 100,
      2
    );
  }

  private computeObjectifReduction(
    getTrajectoireLeviersDataResponse: GetTrajectoireLeviersDataResponse
  ) {
    getTrajectoireLeviersDataResponse.secteurs.forEach((secteur) => {
      secteur.leviers.forEach((levier) => {
        const trajectoireData = !levier.sousSecteursIdentifiants
          ? [secteur]
          : secteur.sousSecteurs.filter((sousSecteur) =>
              levier.sousSecteursIdentifiants?.includes(sousSecteur.identifiant)
            );
        levier.objectifReduction = this.getObjectifReduction(
          levier.pourcentageRegional,
          trajectoireData
        );
      });
    });
  }
}
