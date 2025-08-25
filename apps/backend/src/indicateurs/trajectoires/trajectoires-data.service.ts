import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import {
  CollectiviteResume,
  collectiviteTypeEnum,
} from '@/backend/collectivites/shared/models/collectivite.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { isNil } from 'es-toolkit';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { AuthUser } from '../../users/models/auth.models';
import {
  SourceMetadonnee,
  SourceMetadonneeInsert,
} from '../shared/models/indicateur-source-metadonnee.table';
import { SourceInsert } from '../shared/models/indicateur-source.table';
import {
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
} from '../shared/models/indicateur-valeur.table';
import IndicateurSourcesService from '../sources/indicateur-sources.service';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import { DonneesARemplirResultType } from './donnees-a-remplir-result.dto';
import { DonneesARemplirValeurType } from './donnees-a-remplir-valeur.dto';
import { DonneesCalculTrajectoireARemplirType } from './donnees-calcul-trajectoire-a-remplir.dto';
import { VerificationTrajectoireRequestType } from './verification-trajectoire.request';
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
  public readonly RARE_SOURCE_ID = 'rare';
  public readonly ALDO_SOURCE_ID = 'aldo';

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

  public readonly SNBC_DATE_REFERENCE = '2015-01-01';
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
    donneesCalculTrajectoire: DonneesCalculTrajectoireARemplirType
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
      .replace(
        CrudValeursService.NULL_SOURCE_ID,
        CrudValeursService.NULL_SOURCE_LABEL
      );
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
        if (source.localeCompare(CrudValeursService.NULL_SOURCE_LABEL) === 0) {
          return CrudValeursService.NULL_SOURCE_ID;
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
   * Récupère les valeurs nécessaires pour calculer la trajectoire SNBC
   * @param collectiviteId Identifiant de la collectivité
   * @return
   */
  async getValeursPourCalculTrajectoire(
    collectiviteId: number,
    forceDonneesCollectivite?: boolean
  ): Promise<DonneesCalculTrajectoireARemplirType> {
    // Récupère les valeurs des indicateurs d'émission pour l'année 2015 (valeur directe ou interpolation)
    const sources = forceDonneesCollectivite
      ? [CrudValeursService.NULL_SOURCE_ID]
      : [this.RARE_SOURCE_ID, this.ALDO_SOURCE_ID];
    this.logger.log(
      `Récupération des données d'émission GES et de consommation pour la collectivité ${collectiviteId} depuis les sources ${sources.join(
        ','
      )}`
    );

    let lastModifiedAt: string | null = null;
    const indicateurValeursEmissionsGes =
      await this.valeursService.getIndicateursValeurs({
        collectiviteId,
        identifiantsReferentiel: _.flatten(
          this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL
        ),
        sources: sources,
      });
    indicateurValeursEmissionsGes.forEach((indicateurValeur) => {
      if (
        !lastModifiedAt ||
        indicateurValeur.indicateur_valeur.modifiedAt > lastModifiedAt
      ) {
        lastModifiedAt = indicateurValeur.indicateur_valeur.modifiedAt;
      }
    });
    const emissionsGesSources = indicateurValeursEmissionsGes
      .map(
        (indicateurValeur) =>
          indicateurValeur.indicateur_source_metadonnee?.sourceId
      )
      .filter((source) => source !== undefined);

    // Construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const donneesEmissionsGes = this.getValeursARemplirPourIdentifiants(
      this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursEmissionsGes
    );

    // Récupère les valeurs des indicateurs de consommation finale pour l'année 2015 (valeur directe ou interpolation)
    const indicateurValeursConsommationsFinales =
      await this.valeursService.getIndicateursValeurs({
        collectiviteId,
        identifiantsReferentiel: _.flatten(
          this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL
        ),
        sources: sources,
      });
    indicateurValeursConsommationsFinales.forEach((indicateurValeur) => {
      if (
        !lastModifiedAt ||
        indicateurValeur.indicateur_valeur.modifiedAt > lastModifiedAt
      ) {
        lastModifiedAt = indicateurValeur.indicateur_valeur.modifiedAt;
      }
    });
    const consommationsFinalesSources = indicateurValeursConsommationsFinales
      .map(
        (indicateurValeur) =>
          indicateurValeur.indicateur_source_metadonnee?.sourceId
      )
      .filter((source) => source !== undefined);

    // Construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const donneesConsommationsFinales = this.getValeursARemplirPourIdentifiants(
      this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursConsommationsFinales
    );

    // Récupère les valeurs des indicateurs de sequestration pour l'année 2015 (valeur directe ou interpolation)
    const indicateurValeursSequestration =
      await this.valeursService.getIndicateursValeurs({
        collectiviteId,
        identifiantsReferentiel: _.flatten(
          this.SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL
        ),
        sources: sources,
      });
    indicateurValeursSequestration.forEach((indicateurValeur) => {
      if (
        !lastModifiedAt ||
        indicateurValeur.indicateur_valeur.modifiedAt > lastModifiedAt
      ) {
        lastModifiedAt = indicateurValeur.indicateur_valeur.modifiedAt;
      }
    });
    const sequestrationSources = indicateurValeursSequestration
      .map(
        (indicateurValeur) =>
          indicateurValeur.indicateur_source_metadonnee?.sourceId
      )
      .filter((source) => source !== undefined);

    // Construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    // Allow closest for sequestration
    const donneesSequestration = this.getValeursARemplirPourIdentifiants(
      this.SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursSequestration,
      true
    );

    const uniqueSources = _.uniq([
      ...emissionsGesSources,
      ...consommationsFinalesSources,
      ...sequestrationSources,
    ]);
    return {
      sources: uniqueSources,
      emissionsGes: donneesEmissionsGes,
      consommationsFinales: donneesConsommationsFinales,
      sequestrations: donneesSequestration,
      lastModifiedAt: lastModifiedAt,
    };
  }

  /**
   * Détermine le tableau de valeurs à insérer dans le spreadsheet.
   * Lorsqu'il y a plusieurs identifiants pour une ligne, les valeurs sont sommées.
   */
  getValeursARemplirPourIdentifiants(
    identifiantsReferentiel: string[][],
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[],
    useClosestIfNoInterpolation?: boolean // if not interpolation is available, allow to use the closest value
  ): DonneesARemplirResultType {
    const valeursARemplir: DonneesARemplirValeurType[] = [];
    const identifiantsReferentielManquants: string[] = [];
    identifiantsReferentiel.forEach((identifiants, index) => {
      const valeurARemplir: DonneesARemplirValeurType = {
        identifiantsReferentiel: identifiants,
        valeur: 0,
        dateMin: null,
        dateMax: null,
      };
      valeursARemplir[index] = valeurARemplir;
      identifiants.forEach((identifiant) => {
        const identifiantIndicateurValeurs = indicateurValeurs.filter(
          (indicateurValeur) =>
            indicateurValeur.indicateur_definition?.identifiantReferentiel ===
              identifiant && !isNil(indicateurValeur.indicateur_valeur.resultat)
        );

        const identifiantIndicateurValeur2015 =
          identifiantIndicateurValeurs.find(
            (indicateurValeur) =>
              indicateurValeur.indicateur_valeur.dateValeur ===
              this.SNBC_DATE_REFERENCE
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
    const time2015 = new Date(this.SNBC_DATE_REFERENCE).getTime();
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
        indicateurValeur.dateValeur < this.SNBC_DATE_REFERENCE &&
        (!dateAvant2015 ||
          (dateAvant2015 && indicateurValeur.dateValeur > dateAvant2015))
      ) {
        dateAvant2015 = indicateurValeur.dateValeur;
        valeurAvant2015 = indicateurValeur.resultat;
      } else if (
        indicateurValeur.dateValeur > this.SNBC_DATE_REFERENCE &&
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
      const time2015 = new Date(this.SNBC_DATE_REFERENCE).getTime();
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

  verificationDonneesARemplirSuffisantes(
    donnees: DonneesCalculTrajectoireARemplirType
  ): boolean {
    const { emissionsGes, consommationsFinales } = donnees;
    const valeurEmissionGesValides = emissionsGes.valeurs.filter(
      (v) => v.valeur !== null
    ).length;
    const valeurConsommationFinalesValides =
      consommationsFinales.valeurs.filter((v) => v.valeur !== null).length;
    return (
      valeurEmissionGesValides >= 4 && valeurConsommationFinalesValides >= 3
    );
  }

  /**
   * Vérifie si la collectivité concernée est une epci et à déjà fait les calculs,
   * ou a les données nécessaires pour lancer le calcul de trajectoire SNBC
   * @param request
   * @return le statut pour déterminer la page à afficher TODO format statut
   */
  async verificationDonneesSnbc(
    request: VerificationTrajectoireRequestType,
    tokenInfo: AuthUser,
    epci?: CollectiviteResume,
    forceRecuperationDonneesUniquementPourLecture = false,
    doNotThrowIfUnauthorized?: boolean
  ): Promise<VerificationTrajectoireResultType> {
    const response: VerificationTrajectoireResultType = {
      status: VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
    };

    // Vérification des droits pour lire les données
    const isAllowedToRead = await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.VISITE'],
      ResourceType.COLLECTIVITE,
      request.collectiviteId,
      doNotThrowIfUnauthorized
    );
    if (!isAllowedToRead) {
      response.status = VerificationTrajectoireStatus.DROITS_INSUFFISANTS;
      return response;
    }

    if (request.forceRecuperationDonnees) {
      forceRecuperationDonneesUniquementPourLecture = true;
    }

    if (!epci) {
      // Vérifie si la collectivité est une commune :
      const collectivite =
        await this.listCollectivitesService.getCollectiviteByAnyIdentifiant(
          request
        );
      if (
        collectivite.type != collectiviteTypeEnum.EPCI &&
        collectivite.type != collectiviteTypeEnum.TEST
      ) {
        // TODO région et département ?
        response.status = VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE;
        return response;
      }
      response.epci = {
        id: collectivite.id,
        nom: collectivite.nom,
        natureInsee: collectivite.natureInsee,
        siren: collectivite.siren,
        communeCode: collectivite.communeCode,
        type: collectivite.type,
      };
    } else {
      response.epci = epci;
    }

    // Hack to change the SIREN of the test EPCI to a valid one
    if (response.epci.siren === this.TEST_COLLECTIVITE_SIREN) {
      this.logger.log(
        `Test collectivite detected, change for a valid SIREN ${this.TEST_COLLECTIVITE_VALID_SIREN}`
      );
      response.epci.siren = this.TEST_COLLECTIVITE_VALID_SIREN;
    }

    // sinon, vérifie s'il existe déjà des données trajectoire SNBC calculées :
    const valeurs = await this.valeursService.getIndicateursValeurs({
      collectiviteId: request.collectiviteId,
      sources: [this.SNBC_SOURCE.id],
    });
    if (valeurs.length > 0) {
      response.valeurs = valeurs.map((v) => v.indicateur_valeur);
      // Si jamais les données on déjà été calculées, on récupère la source depuis le commentaire
      // un peu un hack mais le plus simple aujourd'hui
      const premierValeurAvecCommentaire = response.valeurs.find(
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
          `Aucune source trouvée dans le commentaire ${premierCommentaire} de la valeur d'indicateur ${response.valeurs[0].id}`
        );
      }
      const dateCalcul = premierValeurAvecCommentaire?.modifiedAt;
      response.sourcesDonneesEntree = sourceIdentifiantManquants?.sources || [];
      this.logger.log(
        `Sources des données SNBC déjà calculées : ${response.sourcesDonneesEntree?.join(
          ','
        )}`
      );
      response.indentifiantsReferentielManquantsDonneesEntree =
        sourceIdentifiantManquants?.identifiants_referentiel_manquants || [];
      response.status = VerificationTrajectoireStatus.DEJA_CALCULE;
      response.modifiedAt = dateCalcul;
      if (!forceRecuperationDonneesUniquementPourLecture) {
        return response;
      }
    }
    // sinon, vérifie s'il y a les données suffisantes pour lancer le calcul :
    // Si jamais les données ont déjà été calculées et que l'on a pas défini le flag forceUtilisationDonneesCollectivite, on utilise la meme source
    const donneesCalculTrajectoireARemplir =
      await this.getValeursPourCalculTrajectoire(
        request.collectiviteId,
        !isNil(request.forceUtilisationDonneesCollectivite)
          ? request.forceUtilisationDonneesCollectivite
          : response.sourcesDonneesEntree?.includes(
              CrudValeursService.NULL_SOURCE_ID
            )
          ? true
          : false
      );

    const donneesSuffisantes = this.verificationDonneesARemplirSuffisantes(
      donneesCalculTrajectoireARemplir
    );
    response.donneesEntree = donneesCalculTrajectoireARemplir;
    // si oui, retourne 'pret a calculer'
    if (donneesSuffisantes) {
      if (response.status !== VerificationTrajectoireStatus.DEJA_CALCULE) {
        response.status = VerificationTrajectoireStatus.PRET_A_CALCULER;
      } else if (
        response.status === VerificationTrajectoireStatus.DEJA_CALCULE &&
        response.modifiedAt &&
        response.donneesEntree?.lastModifiedAt &&
        response.modifiedAt < response.donneesEntree.lastModifiedAt
      ) {
        response.status = VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE;
      }
      return response;
    }
    // sinon, retourne 'données manquantes'
    response.status = VerificationTrajectoireStatus.DONNEES_MANQUANTES;
    return response;
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
        PermissionOperationEnum['INDICATEURS.EDITION'],
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    await this.valeursService.deleteIndicateurValeurs({
      collectiviteId,
      metadonneeId: snbcMetadonneesId,
    });
  }
}
