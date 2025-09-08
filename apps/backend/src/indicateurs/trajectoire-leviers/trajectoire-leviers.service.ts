import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import { ListDefinitionsService } from '@/backend/indicateurs/definitions/list-definitions/list-definitions.service';
import { GetTrajectoireLeviersDataRequest } from '@/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import {
  GetTrajectoireLeviersDataResponse,
  TrajectoireData,
  TrajectoireLevier,
  TrajectoireSecteur,
} from '@/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.response';
import {
  LevierConfiguration,
  RegionCode,
  SecteurConfiguration,
  TRAJECTOIRE_LEVIERS_CONFIGURATION,
  TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
} from '@/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.config';
import TrajectoiresDataService from '@/backend/indicateurs/trajectoires/trajectoires-data.service';
import CrudValeursService from '@/backend/indicateurs/valeurs/crud-valeurs.service';
import { GetIndicateursValeursResponseType } from '@/backend/indicateurs/valeurs/get-indicateur-valeurs.response';
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
import { isNil, sum, sumBy } from 'es-toolkit';

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
    indicateurValeurs: GetIndicateursValeursResponseType,
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
    indicateurValeursObjectifs2030: GetIndicateursValeursResponseType,
    indicateurValeursObjectifs2019: GetIndicateursValeursResponseType,
    indicateurValeursResultats2019: GetIndicateursValeursResponseType,
    resultatSourcesByPriority: string[]
  ): {
    data: TrajectoireData;
    identifiantManquants: string[];
  } {
    const objectifs2030 = identifiants.map((identifiant) =>
      this.getTrajectoireObjectifOrResultatForIdentifiant(
        identifiant,
        indicateurValeursObjectifs2030,
        'objectif',
        [this.trajectoiresDataService.SNBC_SOURCE.id]
      )
    );
    const objectifs2019 = identifiants.map((identifiant) =>
      this.getTrajectoireObjectifOrResultatForIdentifiant(
        identifiant,
        indicateurValeursObjectifs2019,
        'objectif',
        [this.trajectoiresDataService.SNBC_SOURCE.id]
      )
    );
    const resultats2019 = identifiants.map((identifiant) =>
      this.getTrajectoireObjectifOrResultatForIdentifiant(
        identifiant,
        indicateurValeursResultats2019,
        'resultat',
        resultatSourcesByPriority
      )
    );

    const identifiantsWithMissingData = identifiants.filter(
      (identifiant, index) => {
        if (
          isNil(resultats2019[index]) ||
          isNil(objectifs2019[index]) ||
          isNil(objectifs2030[index])
        ) {
          return true;
        }
        return false;
      }
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
    indicateurValeursObjectifs2030: GetIndicateursValeursResponseType,
    indicateurValeursObjectifs2019: GetIndicateursValeursResponseType,
    indicateurValeursResultats2019: GetIndicateursValeursResponseType,
    resultatSourcesByPriority: string[]
  ): {
    secteurData: TrajectoireSecteur;
    identifiantManquants: string[];
  } {
    const { data, identifiantManquants: secteurIdentifiantManquants } =
      this.getTrajectoireDataForIdentifiants(
        secteur.identifiants,
        indicateurValeursObjectifs2030,
        indicateurValeursObjectifs2019,
        indicateurValeursResultats2019,
        resultatSourcesByPriority
      );

    const neededSousSecteurs = secteur.leviers.reduce((acc, levier) => {
      if (levier.sousSecteursIdentifiants) {
        return [...new Set([...acc, ...levier.sousSecteursIdentifiants])];
      }
      return acc;
    }, [] as string[]);

    const neededSousSecteursData = neededSousSecteurs.map((sousSecteur) => ({
      identifiant: sousSecteur,
      ...this.getTrajectoireDataForIdentifiants(
        [sousSecteur],
        indicateurValeursObjectifs2030,
        indicateurValeursObjectifs2019,
        indicateurValeursResultats2019,
        resultatSourcesByPriority
      ),
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
          indicateurValeursObjectifs2030.indicateurs.find(
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

  private extractTrajectoireSource(
    indicateurValeurs: GetIndicateursValeursResponseType
  ): string[] {
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
      throw new InternalServerErrorException(
        `Impossible d'extraire les sources de données utilisées pour calculer la trajectoire de la collectivité à partir du comentaire ${firstValeurWithCommentaire?.objectifCommentaire}`
      );
    }
    return extractedTrajectoireSource.sources;
  }

  async getData(
    input: GetTrajectoireLeviersDataRequest,
    user: AuthUser
  ): Promise<GetTrajectoireLeviersDataResponse> {
    this.logger.log(
      `Get trajectoire leviers input data for collectivite: ${input.collectiviteId}`
    );

    const collectivite =
      await this.collectiviteService.getCollectiviteByAnyIdentifiant(input);
    if (collectivite.type !== 'epci' && collectivite.type !== 'test') {
      throw new BadRequestException(
        'La collectivité doit être un EPCI pour récupérer les données de trajectoire leviers'
      );
    }
    input.collectiviteId = collectivite.id;
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
      await this.indicateursService.getIndicateurValeursGroupees(
        {
          collectiviteId: collectivite.id,
          identifiantsReferentiel: TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
          sources: [this.trajectoiresDataService.SNBC_SOURCE.id],
          dateDebut: `${this.TARGET_YEAR}-01-01`,
          dateFin: `${this.TARGET_YEAR}-12-31`,
        },
        user
      );

    const indicateurValeursObjectifs2019 =
      await this.indicateursService.getIndicateurValeursGroupees(
        {
          collectiviteId: collectivite.id,
          identifiantsReferentiel: TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
          sources: [this.trajectoiresDataService.SNBC_SOURCE.id],
          dateDebut: `${this.REFERENCE_YEAR}-01-01`,
          dateFin: `${this.REFERENCE_YEAR}-12-31`,
        },
        user
      );

    // On peut extraire la source de données utilisée pour calculer la trajectoire
    getTrajectoireLeviersDataResponse.sourcesResultats =
      this.extractTrajectoireSource(indicateurValeursObjectifs2030);

    this.logger.log(
      `La trajectoire de la collectivite ${
        collectivite.id
      } a été calculée à partir des sources suivantes: ${getTrajectoireLeviersDataResponse.sourcesResultats.join(
        ', '
      )}`
    );

    // Maintenant on récupère les valeurs résultats pour ces sources
    const indicateurValeursResultats2019 =
      await this.indicateursService.getIndicateurValeursGroupees(
        {
          collectiviteId: collectivite.id,
          identifiantsReferentiel: TRAJECTOIRE_LEVIERS_INDICATEURS_IDENTIFIANTS,
          sources: getTrajectoireLeviersDataResponse.sourcesResultats,
          dateDebut: `${this.REFERENCE_YEAR}-01-01`,
          dateFin: `${this.REFERENCE_YEAR}-12-31`,
        },
        user
      );

    // On affecte les données aux secteurs à partir de la configuration
    const regionCode = `${collectivite.regionCode}` as RegionCode;
    const secteursData = TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs.map(
      (secteur) =>
        this.getSecteurData(
          secteur,
          regionCode,
          indicateurValeursObjectifs2030,
          indicateurValeursObjectifs2019,
          indicateurValeursResultats2019,
          getTrajectoireLeviersDataResponse.sourcesResultats
        )
    );
    getTrajectoireLeviersDataResponse.secteurs = secteursData.map(
      (data) => data.secteurData
    );
    getTrajectoireLeviersDataResponse.identifiantManquants = [
      ...new Set(secteursData.flatMap((data) => data.identifiantManquants)),
    ];

    // On calcule les objectifs de réduction pour les leviers à partir des données des secteurs/sous-secteurs et des pourcentages régionaux
    this.computeObjectifReduction(getTrajectoireLeviersDataResponse);

    return getTrajectoireLeviersDataResponse;
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
      (data) => data.objectif2030!
    );

    return roundTo(
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
