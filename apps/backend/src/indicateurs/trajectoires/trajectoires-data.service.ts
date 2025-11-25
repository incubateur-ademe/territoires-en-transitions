import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import {
  CollectiviteResume,
  CollectiviteType,
  collectiviteTypeEnum,
} from '@/backend/collectivites/shared/models/collectivite.table';
import {
  canTrajectoireBeComputedFromInputData,
  hasEnoughCarbonSequestrationDataFromSource,
  hasEnoughConsommationsFinalesDataFromSource,
  hasEnoughEmissionsGesDataFromSource,
} from '@/backend/indicateurs/trajectoires/domain/can-trajectoire-be-computed';
import {
  COLLECTIVITE_SOURCE_ID,
  COLLECTIVITE_SOURCE_LABEL,
} from '@/backend/indicateurs/valeurs/valeurs.constants';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { flatten, isEqual, isNil, maxBy, uniq } from 'es-toolkit';
import { DateTime } from 'luxon';
import { AuthUser } from '../../users/models/auth.models';
import {
  SourceMetadonnee,
  SourceMetadonneeInsert,
} from '../shared/models/indicateur-source-metadonnee.table';
import { SourceInsert } from '../shared/models/indicateur-source.table';
import IndicateurSourcesService from '../sources/indicateur-sources.service';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import {
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
} from '../valeurs/indicateur-valeur.table';
import {
  DATE_DEBUT_SNBC_V2_REFERENCE,
  DATE_FIN_SNBC_V2_REFERENCE,
} from './domain/constants';
import { SourceIndicateur } from './domain/source-indicateur';
import { DonneesARemplirResultType } from './donnees-a-remplir-result.dto';
import { DonneesARemplirValeurType } from './donnees-a-remplir-valeur.dto';
import { DataInputForTrajectoireCompute } from './donnees-calcul-trajectoire-a-remplir.dto';
import { VerificationTrajectoireRequest } from './verification-trajectoire.request';
import {
  VerificationTrajectoireResultType,
  VerificationTrajectoireStatus,
} from './verification-trajectoire.response';

@Injectable()
export default class TrajectoiresDataService {
  private readonly logger = new Logger(TrajectoiresDataService.name);

  private readonly OBJECTIF_COMMENTAIRE_SOURCE = "Source des données d'entrée:";
  private readonly OBJECTIF_COMMENTAIRE_INDICATEURS_MANQUANTS =
    'Indicateurs manquants:';

  private readonly OBJECTIF_COMMENTAIRE_REGEXP = new RegExp(
    String.raw`Source[^-]*:\s*(.*?)(?:\s*-\s*${this.OBJECTIF_COMMENTAIRE_INDICATEURS_MANQUANTS}\s*(.*))?$`
  );
  public readonly RARE_SOURCE_ID = SourceIndicateur.RARE;
  public readonly ALDO_SOURCE_ID = SourceIndicateur.ALDO;

  public readonly TEST_COLLECTIVITE_SIREN = '000000000';
  public readonly TEST_COLLECTIVITE_VALID_SIREN = '242900314';

  public readonly SNBC_SOURCE: SourceInsert = {
    id: 'snbc',
    libelle: 'SNBC',
  };
  public readonly SNBC_SOURCE_METADONNEES: SourceMetadonneeInsert = {
    sourceId: this.SNBC_SOURCE.id,
    dateVersion: DateTime.fromISO('2024-07-11T00:00:00', {
      zone: 'utc',
    }).toISO() as string,
    nomDonnees: 'SNBC',
    diffuseur: 'ADEME',
    producteur: 'ADEME',
    // methodologie: '',
    // limites: '',
  };

  public readonly SNBC_DATE_DEBUT_REFERENCE = DATE_DEBUT_SNBC_V2_REFERENCE;
  public readonly SNBC_DATE_FIN_REFERENCE = DATE_FIN_SNBC_V2_REFERENCE;
  public readonly SNBC_ALDO_DATE_DEBUT_REFERENCE = '2018-01-01';
  public readonly SNBC_ALDO_DATE_FIN_REFERENCE = '2018-12-31';
  public readonly SNBC_SIREN_CELLULE = 'Caract_territoire!F6';

  public readonly SNBC_EMISSIONS_GES_CELLULES = 'Carto_en-GES!D6:D13';
  public readonly SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL = [
    ['cae_1.c'], // B6
    ['cae_1.d'], // B7
    ['cae_1.i'], // B8
    ['cae_1.g'], // B9
    ['cae_1.e'], // B10
    ['cae_1.f'], // B11
    ['cae_1.h'], // B12
    ['cae_1.j'], // B13
  ];

  public readonly SNBC_CONSOMMATIONS_CELLULES = 'Carto_en-GES!I29:I35';
  public readonly SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL = [
    ['cae_2.e'], // I29
    ['cae_2.f'], // I30
    ['cae_2.k'], // I31
    ['cae_2.i'], // I32
    ['cae_2.g', 'cae_2.h'], // I33
    ['cae_2.j'], // I34
    ['cae_2.l_pcaet'], // I35
  ];
  public readonly CONSOMMATIONS_IDENTIFIANTS_PREFIX = 'cae_2.';

  public readonly SNBC_SEQUESTRATION_CELLULES = 'Carto_en-GES!C15:C22';
  public readonly SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL = [
    ['cae_63.ca'], // C15 Cultures
    ['cae_63.cb'], // C16 Prairies
    ['cae_63.da'], // C17 Zones humides
    ['cae_63.cd'], // C18 Vergers
    ['cae_63.cc'], // C19 Vignes
    ['cae_63.db'], // C20 Sols artificiels
    ['cae_63.b'], // C21 Forêts
    ['cae_63.e'], // C22 Produits bois
  ];
  public readonly SEQUESTRATION_IDENTIFIANTS_PREFIX = 'cae_63.';

  public readonly CAPTURE_STOCKAGE_CARBONE_TECHNOLOGIQUE_IDENTIFIANT =
    'cae_1.csc';

  public readonly SNBC_TRAJECTOIRE_RESULTAT_CELLULES =
    'TOUS SECTEURS!G221:AP297';
  public readonly SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL = [
    // Sous-secteur: Emissions GES résidentiel
    'cae_1.ca', // 221 Chauffage / Maisons individuelles
    'cae_1.cb', // 222 Chauffage / Logement collectif
    'cae_1.cc', // 223 Autres usages

    // Sous-secteur: Emissions GES tertiaire
    'cae_1.da', // 224 Chauffage (Tertiaire)
    'cae_1.db', // 225 Autres usages (Tertiaire)

    // Sous-secteur: Emissions GES industrie
    'cae_1.ia', // 226 Métaux primaires
    'cae_1.ib', // 227 Chimie
    'cae_1.ic', // 228 Non-métalliques
    'cae_1.id', // 229 Agro-industries
    'cae_1.ie', // 230 Equipements
    'cae_1.if', // 231 Papier-carton
    'cae_1.ig', // 232 Autres industries

    // Sous-secteur: Emissions GES agriculture
    'cae_1.ga', // 233 Energie (Agriculture)
    'cae_1.gb', // 234 Elevage
    'cae_1.gc', // 235 Pratiques culturales

    // Sous-secteur: Emissions GES transports
    'cae_1.ea', // 236 Routier / mobilité locale
    'cae_1.eb', // 237 Routier / autre
    'cae_1.f', // 238 Autres (Transports)
    '',
    '',
    // Sous-secteur: Sequestration UTCATF
    'cae_63.b', // 241 Forêts
    'cae_63.ca', // 242 Cultures
    'cae_63.cb', // 243 Prairies
    'cae_63.da', // 244 Zones humides
    'cae_63.db', // 245 Sols artificiels
    'cae_63.e', // 246 Produits bois
    '',
    '',
    '',
    // Sous-secteur: Consommation énergie (Résidentiel)
    'cae_2.ea', // 250 Chauffage / Maisons individuelles (Consommation énergie)
    'cae_2.eb', // 251 Chauffage / Logement collectif (Consommation énergie)
    'cae_2.ec', // 252 Autres usages (Consommation énergie)

    // Sous-secteur: Consommation énergie (Tertiaire)
    'cae_2.fa', // 253 Chauffage (Tertiaire, Consommation énergie)
    'cae_2.fb', // 254 Autres usages (Tertiaire, Consommation énergie)

    // Sous-secteur: Consommation énergie (Industrie)
    'cae_2.ka', // 255 Métaux primaires (Industrie, Consommation énergie)
    'cae_2.kb', // 256 Chimie (Industrie, Consommation énergie)
    'cae_2.kc', // 257 Non-métalliques (Industrie, Consommation énergie)
    'cae_2.kd', // 258 Agro-industries (Industrie, Consommation énergie)
    'cae_2.ke', // 259 Equipements (Industrie, Consommation énergie)
    'cae_2.kf', // 260 Papier-carton (Industrie, Consommation énergie)
    'cae_2.kg', // 261 Autres industries (Industrie, Consommation énergie),
    '',
    '',
    '',
    '',
    '',
    '',
    // Secteurs
    'cae_1.c', // 268 Résidentiel
    'cae_1.d', // 269 Tertiaire
    'cae_1.i', // 270 Industrie
    'cae_1.g', // 271 Agriculture
    'cae_1.k', // 272 Transports
    'cae_1.h', // 273 Déchets
    'cae_1.j', // 274 Branche énergie
    'cae_63.a', // 227 UTCATF
    'cae_1.csc', // 276 CSC
    'cae_1.aa', // 277 Total net
    '', // 278
    'cae_1.a', // 279 Total brut
    '', // 280
    '', // 281
    '', // 282
    '', // 283
    '', // 284
    '', // 285
    '', // 286
    '', // 287
    '', // 288
    '', // 289
    'cae_2.k', // 290 Industrie
    'cae_2.m', // 291 Transports
    'cae_2.e', // 292 Résidentiel
    'cae_2.f', // 293 Tertiaire
    'cae_2.i', // 294 Agriculture
    'cae_2.j', // 295 Déchets
    'cae_2.l_pcaet', // 296 Branche énergie
    'cae_2.a', // 297 Total
  ];

  private indicateurSourceMetadonnee: SourceMetadonnee | null = null;

  constructor(
    private readonly listCollectivitesService: ListCollectivitesService,
    private readonly indicateurSourcesService: IndicateurSourcesService,
    private readonly valeursService: CrudValeursService,
    private readonly permissionService: PermissionService
  ) {}

  signeInversionSequestration(identifiantReferentiel?: string | null): boolean {
    // Identifiant stocké positivement dans la base de données lorsqu'il y a séquestration, doivent être comptés négativement dans le bilan des émissions GES
    return (
      identifiantReferentiel?.startsWith(
        this.SEQUESTRATION_IDENTIFIANTS_PREFIX
      ) ||
      identifiantReferentiel ===
        this.CAPTURE_STOCKAGE_CARBONE_TECHNOLOGIQUE_IDENTIFIANT
    );
  }

  async getTrajectoireIndicateursMetadonnees(): Promise<SourceMetadonnee> {
    if (!this.indicateurSourceMetadonnee) {
      // Création de la source métadonnée SNBC si elle n'existe pas
      this.indicateurSourceMetadonnee =
        await this.indicateurSourcesService.getIndicateurSourceMetadonnee(
          this.SNBC_SOURCE.id,
          this.SNBC_SOURCE_METADONNEES.dateVersion
        );
      if (!this.indicateurSourceMetadonnee) {
        this.logger.log(
          `Création de la metadonnée pour la source ${this.SNBC_SOURCE.id} et la date ${this.SNBC_SOURCE_METADONNEES.dateVersion}`
        );
        await this.indicateurSourcesService.upsertIndicateurSource(
          this.SNBC_SOURCE
        );

        this.indicateurSourceMetadonnee =
          await this.indicateurSourcesService.createIndicateurSourceMetadonnee(
            this.SNBC_SOURCE_METADONNEES
          );
      }
    }
    this.logger.log(
      `La metadonnée pour la source ${this.SNBC_SOURCE.id} et la date ${this.SNBC_SOURCE_METADONNEES.dateVersion} existe avec l'identifiant ${this.indicateurSourceMetadonnee.id}`
    );
    return this.indicateurSourceMetadonnee;
  }

  getObjectifCommentaire(
    donneesCalculTrajectoire: DataInputForTrajectoireCompute
  ): string {
    const identifiantsManquants = [
      ...donneesCalculTrajectoire.emissionsGes.identifiantsReferentielManquants,
      ...donneesCalculTrajectoire.consommationsFinales
        .identifiantsReferentielManquants,
      ...donneesCalculTrajectoire.sequestrations
        .identifiantsReferentielManquants,
    ];
    const source = donneesCalculTrajectoire.sources
      .join(',')
      .replace(COLLECTIVITE_SOURCE_ID, COLLECTIVITE_SOURCE_LABEL);
    let commentaitre = `${this.OBJECTIF_COMMENTAIRE_SOURCE} ${source}`;
    if (identifiantsManquants.length) {
      commentaitre += ` - ${
        this.OBJECTIF_COMMENTAIRE_INDICATEURS_MANQUANTS
      } ${identifiantsManquants.join(', ')}`;
    }

    return commentaitre;
  }

  extractSourceIdentifiantManquantsFromCommentaire(commentaire: string): {
    sources: string[];
    identifiants_referentiel_manquants: string[];
  } | null {
    const match = commentaire.match(this.OBJECTIF_COMMENTAIRE_REGEXP);
    if (match) {
      const extractedSources = match[1].split(',').map((i) => i.trim());
      const replacedExtractedSource = extractedSources.map((source) => {
        if (source.localeCompare(COLLECTIVITE_SOURCE_LABEL) === 0) {
          return COLLECTIVITE_SOURCE_ID;
        }
        return source;
      });
      return {
        sources: replacedExtractedSource,
        identifiants_referentiel_manquants: match[2]
          ? match[2]
              .split(',')
              .map((i) => i.trim())
              .filter((i) => i)
          : [],
      };
    }
    return null;
  }

  /**
   * Récupère les indicateurs renseignés par la collectivité en priorité, puis open data pour les manquants
   * @param collectiviteId Identifiant de la collectivité
   * @param identifiantsReferentiel Liste des indicateurs à récupérer
   * @return Indicateurs combinant ceux de la collectivité et ceux en open data
   */
  private async getIndicateursValeursBySourceId(
    collectiviteId: number,
    sourceId: typeof COLLECTIVITE_SOURCE_ID | SourceIndicateur,
    identifiantsReferentiel: string[],
    options: {
      dateDebut?: string;
      dateFin?: string;
    }
  ): Promise<IndicateurValeurAvecMetadonnesDefinition[]> {
    const indicateursSourceCollectivite =
      await this.valeursService.getIndicateursValeurs({
        collectiviteId,
        identifiantsReferentiel,
        sources: [sourceId],
        dateDebut: options?.dateDebut,
        dateFin: options?.dateFin,
      });

    return indicateursSourceCollectivite;
  }

  private getSource(data: IndicateurValeurAvecMetadonnesDefinition[]) {
    return data
      .map(
        (indicateurValeur) =>
          indicateurValeur.indicateur_source_metadonnee?.sourceId
      )
      .filter((source) => source !== undefined);
  }
  /**
   * Generic method to fetch indicator data with fallback to open data source
   * @param collectiviteId
   * @param identifiants Referentiel identifiers to fetch
   * @param isCollectiviteDataSufficient Function to validate if collectivite data is sufficient
   * @param fallbackSourceId Source to use if collectivite data is insufficient
   */
  private async getIndicateurDataWithFallback(
    collectiviteId: number,
    identifiants: string[],
    isCollectiviteDataSufficient: (
      data: IndicateurValeurAvecMetadonnesDefinition[]
    ) => boolean,
    fallbackSourceId: SourceIndicateur,
    options: {
      dateDebut: string;
      dateFin: string;
    }
  ): Promise<{
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[];
    sourceId: Array<string>;
  }> {
    const collectiviteData = await this.getIndicateursValeursBySourceId(
      collectiviteId,
      COLLECTIVITE_SOURCE_ID,
      identifiants,
      {
        dateDebut: this.SNBC_DATE_DEBUT_REFERENCE,
        dateFin: this.SNBC_DATE_FIN_REFERENCE,
      }
    );

    if (isCollectiviteDataSufficient(collectiviteData)) {
      return {
        indicateurValeurs: collectiviteData,
        sourceId: this.getSource(collectiviteData),
      };
    }

    const fallbackData = await this.getIndicateursValeursBySourceId(
      collectiviteId,
      fallbackSourceId,
      identifiants,
      options
    );

    return {
      indicateurValeurs: fallbackData,
      sourceId: this.getSource(fallbackData),
    };
  }

  private async getEmissionsGesData(collectiviteId: number): Promise<{
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[];
    sourceId: Array<string>;
  }> {
    return this.getIndicateurDataWithFallback(
      collectiviteId,
      flatten(this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL),
      (data) =>
        hasEnoughEmissionsGesDataFromSource(
          data.map((v) => v.indicateur_valeur.resultat)
        ).isDataSufficient,
      this.RARE_SOURCE_ID,
      {
        dateDebut: this.SNBC_DATE_DEBUT_REFERENCE,
        dateFin: this.SNBC_DATE_FIN_REFERENCE,
      }
    );
  }

  private async getSequestrationData(collectiviteId: number): Promise<{
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[];
    sourceId: Array<string>;
  }> {
    return this.getIndicateurDataWithFallback(
      collectiviteId,
      flatten(this.SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL),
      (data) =>
        hasEnoughCarbonSequestrationDataFromSource(
          data.map((v) => v.indicateur_valeur.resultat)
        ).isDataSufficient,
      this.ALDO_SOURCE_ID,
      {
        dateDebut: this.SNBC_ALDO_DATE_DEBUT_REFERENCE,
        dateFin: this.SNBC_ALDO_DATE_FIN_REFERENCE,
      }
    );
  }

  private async getConsommationsFinalesData(collectiviteId: number): Promise<{
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[];
    sourceId: Array<string>;
  }> {
    return this.getIndicateurDataWithFallback(
      collectiviteId,
      flatten(this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL),
      (data) =>
        hasEnoughConsommationsFinalesDataFromSource(
          data.map((v) => v.indicateur_valeur.resultat)
        ).isDataSufficient,
      this.RARE_SOURCE_ID,
      {
        dateDebut: this.SNBC_DATE_DEBUT_REFERENCE,
        dateFin: this.SNBC_DATE_FIN_REFERENCE,
      }
    );
  }

  async buildDataInputForTrajectoireCompute({
    collectiviteId,
  }: {
    collectiviteId: number;
  }): Promise<DataInputForTrajectoireCompute> {
    const indicateurValeursEmissionsGes = await this.getEmissionsGesData(
      collectiviteId
    );

    const emissionsGes = this.getValeursARemplirPourIdentifiants({
      identifiantsReferentiel: this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
      indicateurValeurs: indicateurValeursEmissionsGes.indicateurValeurs,
    });

    const indicateurValeursConsommationsFinales =
      await this.getConsommationsFinalesData(collectiviteId);

    const consommationsFinales = this.getValeursARemplirPourIdentifiants({
      identifiantsReferentiel: this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL,
      indicateurValeurs:
        indicateurValeursConsommationsFinales.indicateurValeurs,
    });

    const indicateurValeursSequestration = await this.getSequestrationData(
      collectiviteId
    );

    const sequestrations = this.getValeursARemplirPourIdentifiants({
      identifiantsReferentiel: this.SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL,
      indicateurValeurs: indicateurValeursSequestration.indicateurValeurs,
      useClosestIfNoInterpolation: true,
    });

    const uniqueSources = uniq([
      ...indicateurValeursEmissionsGes.sourceId,
      ...indicateurValeursConsommationsFinales.sourceId,
      ...indicateurValeursSequestration.sourceId,
    ]);

    const allIndicateurValeurs = [
      ...indicateurValeursEmissionsGes.indicateurValeurs,
      ...indicateurValeursConsommationsFinales.indicateurValeurs,
      ...indicateurValeursSequestration.indicateurValeurs,
    ];

    const lastModifiedAt =
      maxBy(
        allIndicateurValeurs,
        (item: IndicateurValeurAvecMetadonnesDefinition) =>
          new Date(item.indicateur_valeur.modifiedAt).getTime()
      )?.indicateur_valeur.modifiedAt ?? null;

    return {
      sources: uniqueSources,
      emissionsGes,
      consommationsFinales,
      sequestrations,
      lastModifiedAt,
    };
  }

  /**
   * Détermine le tableau de valeurs à insérer dans le spreadsheet.
   * Lorsqu'il y a plusieurs identifiants pour une ligne, les valeurs sont sommées.
   */
  getValeursARemplirPourIdentifiants(args: {
    identifiantsReferentiel: string[][];
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[];
    useClosestIfNoInterpolation?: boolean; // if not interpolation is available, allow to use the closest value
  }): DonneesARemplirResultType {
    const {
      identifiantsReferentiel,
      indicateurValeurs,
      useClosestIfNoInterpolation,
    } = args;
    const identifiantsReferentielManquants: string[] = [];
    const valeursARemplir: DonneesARemplirValeurType[] =
      identifiantsReferentiel.map((identifiants) => {
        const valeurARemplir: DonneesARemplirValeurType = {
          identifiantsReferentiel: identifiants,
          valeur: 0,
          dateMin: null,
          dateMax: null,
        };
        identifiants.forEach((identifiant) => {
          const identifiantIndicateurValeurs = indicateurValeurs.filter(
            (indicateurValeur) =>
              indicateurValeur.indicateur_definition?.identifiantReferentiel ===
                identifiant &&
              !isNil(indicateurValeur.indicateur_valeur.resultat)
          );

          const identifiantIndicateurValeur2015 =
            identifiantIndicateurValeurs.find(
              (indicateurValeur) =>
                indicateurValeur.indicateur_valeur.dateValeur ===
                this.SNBC_DATE_DEBUT_REFERENCE
            );
          if (
            identifiantIndicateurValeur2015 &&
            !isNil(identifiantIndicateurValeur2015.indicateur_valeur.resultat) // 0 est une valeur valide
          ) {
            // Si il n'y a pas déjà eu une valeur manquante qui a placé la valeur à null
            if (valeurARemplir.valeur !== null) {
              valeurARemplir.valeur +=
                identifiantIndicateurValeur2015.indicateur_valeur.resultat;
              if (
                !valeurARemplir.dateMax ||
                identifiantIndicateurValeur2015.indicateur_valeur.dateValeur >
                  valeurARemplir.dateMax
              ) {
                valeurARemplir.dateMax =
                  identifiantIndicateurValeur2015.indicateur_valeur.dateValeur;
              }
              if (
                !valeurARemplir.dateMin ||
                identifiantIndicateurValeur2015.indicateur_valeur.dateValeur <
                  valeurARemplir.dateMin
              ) {
                valeurARemplir.dateMin =
                  identifiantIndicateurValeur2015.indicateur_valeur.dateValeur;
              }
            }
          } else {
            const indicateurValeurs = identifiantIndicateurValeurs.map(
              (v) => v.indicateur_valeur
            );
            let interpolationOrClosestResultat =
              this.getInterpolationValeur(indicateurValeurs);
            if (
              isNil(interpolationOrClosestResultat.valeur) &&
              useClosestIfNoInterpolation
            ) {
              interpolationOrClosestResultat =
                this.getClosestValeur(indicateurValeurs);
            }

            if (isNil(interpolationOrClosestResultat.valeur)) {
              identifiantsReferentielManquants.push(identifiant);
              valeurARemplir.valeur = null;
            } else {
              // Si il n'y a pas déjà eu une valeur manquante qui a placé la valeur à null (pour un autre indicateur contribuant à la même valeur)
              if (valeurARemplir.valeur !== null) {
                valeurARemplir.valeur += interpolationOrClosestResultat.valeur;
                if (
                  !valeurARemplir.dateMax ||
                  (interpolationOrClosestResultat.date_max &&
                    interpolationOrClosestResultat.date_max >
                      valeurARemplir.dateMax)
                ) {
                  valeurARemplir.dateMax =
                    interpolationOrClosestResultat.date_max;
                }
                if (
                  !valeurARemplir.dateMin ||
                  (interpolationOrClosestResultat.date_min &&
                    interpolationOrClosestResultat.date_min <
                      valeurARemplir.dateMin)
                ) {
                  valeurARemplir.dateMin =
                    interpolationOrClosestResultat.date_min;
                }
              }
            }
          }
        });
        return valeurARemplir;
      });
    return {
      valeurs: valeursARemplir,
      identifiantsReferentielManquants: identifiantsReferentielManquants,
    };
  }

  getClosestValeur(indicateurValeurs: IndicateurValeur[]): {
    valeur: number | null;
    date_min: string | null;
    date_max: string | null;
  } {
    const time2015 = new Date(this.SNBC_DATE_DEBUT_REFERENCE).getTime();
    let closestValeur: number | null = null;
    let closestDate: string | null = null;
    let currentDiff: number | null = null;

    indicateurValeurs.forEach((indicateurValeur) => {
      const timeIndicateurValeur = new Date(
        indicateurValeur.dateValeur
      ).getTime();
      const diff = Math.abs(time2015 - timeIndicateurValeur);
      if (!currentDiff || diff < currentDiff) {
        currentDiff = diff;
        closestValeur = indicateurValeur.resultat;
        closestDate = indicateurValeur.dateValeur;
      }
    });

    // Return this response with both date_min & date_max to match getInterpolationValeur signature and simplify rest of the code
    return {
      valeur: closestValeur,
      date_min: closestDate,
      date_max: closestDate,
    };
  }

  getInterpolationValeur(indicateurValeurs: IndicateurValeur[]): {
    valeur: number | null;
    date_min: string | null;
    date_max: string | null;
  } {
    let valeur2015Interpolee: number | null = null;
    let valeurAvant2015: number | null = null;
    let dateAvant2015: string | null = null;
    let valeurApres2015: number | null = null;
    let dateApres2015: string | null = null;

    indicateurValeurs.forEach((indicateurValeur) => {
      if (
        indicateurValeur.dateValeur < this.SNBC_DATE_DEBUT_REFERENCE &&
        (!dateAvant2015 ||
          (dateAvant2015 && indicateurValeur.dateValeur > dateAvant2015))
      ) {
        dateAvant2015 = indicateurValeur.dateValeur;
        valeurAvant2015 = indicateurValeur.resultat;
      } else if (
        indicateurValeur.dateValeur > this.SNBC_DATE_FIN_REFERENCE &&
        (!dateApres2015 ||
          (dateApres2015 && indicateurValeur.dateValeur < dateApres2015))
      ) {
        dateApres2015 = indicateurValeur.dateValeur;
        valeurApres2015 = indicateurValeur.resultat;
      }
    });

    if (
      valeurAvant2015 !== null &&
      valeurApres2015 !== null &&
      dateAvant2015 &&
      dateApres2015
    ) {
      // Convert dates to timestamps (milliseconds since Epoch)
      const time2015 = new Date(this.SNBC_DATE_DEBUT_REFERENCE).getTime();
      const timeAvant2015 = new Date(dateAvant2015).getTime();
      const timeApres2015 = new Date(dateApres2015).getTime();

      // Calculate the interpolated value
      if (valeurApres2015 - valeurAvant2015 === 0) {
        valeur2015Interpolee = valeurAvant2015;
      } else {
        valeur2015Interpolee =
          valeurAvant2015 +
          ((time2015 - timeAvant2015) / (timeApres2015 - timeAvant2015)) *
            (valeurApres2015 - valeurAvant2015);
      }
    }

    return {
      valeur: valeur2015Interpolee,
      date_min: dateAvant2015,
      date_max: dateApres2015,
    };
  }

  /**
   * Vérifie si la collectivité concernée est une epci et a déjà fait les calculs,
   * ou a les données nécessaires pour lancer le calcul de trajectoire SNBC
   * @param request
   * @return le statut pour déterminer la page à afficher TODO format statut
   */
  async verificationDonneesSnbc(args: {
    request: VerificationTrajectoireRequest;
    tokenInfo: AuthUser;
    epci?: CollectiviteResume;
    doNotThrowIfUnauthorized?: boolean;
  }): Promise<VerificationTrajectoireResultType> {
    const {
      request,
      tokenInfo,
      epci: maybeEPCI,
      doNotThrowIfUnauthorized,
    } = args;

    const forceRecuperationDonneesUniquementPourLecture =
      request.forceRecuperationDonnees ?? false;

    const isAllowedToRead = await this.permissionService.isAllowed(
      tokenInfo,
      'indicateurs.valeurs.read_public',
      ResourceType.COLLECTIVITE,
      request.collectiviteId,
      doNotThrowIfUnauthorized
    );
    const epci =
      maybeEPCI ||
      (await this.listCollectivitesService.getCollectiviteByAnyIdentifiant(
        request
      ));

    if (!isAllowedToRead) {
      return {
        donneesEntree: null,
        status: VerificationTrajectoireStatus.DROITS_INSUFFISANTS,
        epci,
      };
    }

    const SUPPORTED_EPCI_TYPES: CollectiviteType[] = [
      collectiviteTypeEnum.EPCI,
      collectiviteTypeEnum.TEST,
    ] as const;

    if (SUPPORTED_EPCI_TYPES.includes(epci.type) === false) {
      return {
        donneesEntree: null,
        status: VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
        epci,
      };
    }

    // Hack to change the SIREN of the test EPCI to a valid one
    if (epci.siren === this.TEST_COLLECTIVITE_SIREN) {
      this.logger.log(
        `Test collectivite detected, change for a valid SIREN ${this.TEST_COLLECTIVITE_VALID_SIREN}`
      );
      epci.siren = this.TEST_COLLECTIVITE_VALID_SIREN;
    }

    const valeurs = await this.valeursService.getIndicateursValeurs({
      collectiviteId: request.collectiviteId,
      sources: [this.SNBC_SOURCE.id],
    });

    const valeursResponse = valeurs.map((v) => v.indicateur_valeur);
    const existingTrajectoireData =
      this.processExistingTrajectoireData(valeursResponse);

    const shouldReturnExistingTrajectoireData =
      valeurs.length > 0 &&
      forceRecuperationDonneesUniquementPourLecture === false;

    if (shouldReturnExistingTrajectoireData) {
      return {
        epci,
        status: VerificationTrajectoireStatus.DEJA_CALCULE,
        donneesEntree: null,
        ...existingTrajectoireData,
      };
    }

    const dataInputForTrajectoireCompute =
      await this.buildDataInputForTrajectoireCompute({
        collectiviteId: request.collectiviteId,
      });

    const canTrajectoireBeComputed = canTrajectoireBeComputedFromInputData({
      emissionsGesValeurs: dataInputForTrajectoireCompute.emissionsGes.valeurs,
      consommationsFinalesValeurs:
        dataInputForTrajectoireCompute.consommationsFinales.valeurs,
      carbonSequestrationValeurs:
        dataInputForTrajectoireCompute.sequestrations.valeurs,
    });

    return {
      epci,
      donneesEntree: dataInputForTrajectoireCompute,
      status: this.getStatus({
        canTrajectoireBeComputed,
        donneesEntree: dataInputForTrajectoireCompute,
        existingTrajectoireData,
      }),
    };
  }

  async deleteTrajectoireSnbc(
    collectiviteId: number,
    snbcMetadonneesId?: number,
    user?: AuthUser
  ): Promise<void> {
    if (!snbcMetadonneesId) {
      const indicateurSourceMetadonnee =
        await this.indicateurSourcesService.getIndicateurSourceMetadonnee(
          this.SNBC_SOURCE.id,
          this.SNBC_SOURCE_METADONNEES.dateVersion
        );
      if (indicateurSourceMetadonnee) {
        snbcMetadonneesId = indicateurSourceMetadonnee.id;
      }
    }

    if (!snbcMetadonneesId) {
      throw new InternalServerErrorException(
        `Impossible de trouver l'identifiant de la metadonnée SNBC`
      );
    }

    // Vérifie les droits de l'utilisateur
    if (user) {
      await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['INDICATEURS.VALEURS.MUTATE'],
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    await this.valeursService.deleteIndicateurValeurs({
      collectiviteId,
      metadonneeId: snbcMetadonneesId,
    });
  }

  private processExistingTrajectoireData(valeurs: IndicateurValeur[]): {
    modifiedAt: string | undefined;
    sourcesDonneesEntree: string[];
    indentifiantsReferentielManquantsDonneesEntree: string[];
    valeurs: IndicateurValeur[];
  } {
    // Si jamais les données on déjà été calculées, on récupère la source depuis le commentaire
    // un peu un hack mais le plus simple aujourd'hui
    const premierValeurAvecCommentaire = valeurs?.find(
      (v) => v.objectifCommentaire
    );
    const premierCommentaire =
      premierValeurAvecCommentaire?.objectifCommentaire;
    const sourceIdentifiantManquants =
      this.extractSourceIdentifiantManquantsFromCommentaire(
        premierCommentaire || ''
      );
    if (!sourceIdentifiantManquants?.sources?.length) {
      this.logger.warn(
        `Aucune source trouvée dans le commentaire ${premierCommentaire} de la valeur d'indicateur ${valeurs?.[0]?.id}`
      );
    }
    const modifiedAt = premierValeurAvecCommentaire?.modifiedAt;
    const sourcesDonneesEntree = sourceIdentifiantManquants?.sources || [];
    this.logger.log(
      `Sources des données SNBC déjà calculées : ${sourcesDonneesEntree.join(
        ','
      )}`
    );
    return {
      modifiedAt,
      sourcesDonneesEntree,
      indentifiantsReferentielManquantsDonneesEntree:
        sourceIdentifiantManquants?.identifiants_referentiel_manquants || [],
      valeurs,
    };
  }

  private getStatus({
    canTrajectoireBeComputed,
    donneesEntree,
    existingTrajectoireData,
  }: {
    canTrajectoireBeComputed: boolean;
    donneesEntree: DataInputForTrajectoireCompute;
    existingTrajectoireData: {
      modifiedAt: string | undefined;
      sourcesDonneesEntree: string[];
      indentifiantsReferentielManquantsDonneesEntree: string[];
      valeurs: IndicateurValeur[];
    };
  }): VerificationTrajectoireStatus {
    if (canTrajectoireBeComputed === false) {
      return VerificationTrajectoireStatus.DONNEES_MANQUANTES;
    }

    if (existingTrajectoireData.modifiedAt === undefined) {
      return VerificationTrajectoireStatus.PRET_A_CALCULER;
    }

    const newTrajectoireCanBeComputed =
      donneesEntree.lastModifiedAt &&
      isEqual(
        new Date(donneesEntree.lastModifiedAt),
        new Date(existingTrajectoireData.modifiedAt)
      ) === false;

    if (newTrajectoireCanBeComputed) {
      return VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE;
    }
    return VerificationTrajectoireStatus.DEJA_CALCULE;
  }
}
