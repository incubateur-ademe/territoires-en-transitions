import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { isNil } from 'es-toolkit';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { NiveauAcces, SupabaseJwtPayload } from '../../auth/models/auth.models';
import { AuthService } from '../../auth/services/auth.service';
import { EpciType } from '../../collectivites/models/collectivite.models';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import {
  DonneesARemplirResultType,
  DonneesARemplirValeurType,
  DonneesCalculTrajectoireARemplirType,
  VerificationDonneesSNBCResult,
  VerificationDonneesSNBCStatus,
  VerificationTrajectoireRequestType,
} from '../models/calcultrajectoire.models';
import {
  CreateIndicateurSourceMetadonneeType,
  CreateIndicateurSourceType,
  IndicateurSourceMetadonneeType,
  IndicateurValeurAvecMetadonnesDefinition,
  IndicateurValeurType,
} from '../models/indicateur.models';
import IndicateursService from './indicateurs.service';
import IndicateurSourcesService from './indicateurSources.service';

@Injectable()
export default class TrajectoiresDataService {
  private readonly logger = new Logger(TrajectoiresDataService.name);

  private readonly OBJECTIF_COMMENTAIRE_SOURCE = 'Source:';
  private readonly OBJECTIF_COMMENTAIRE_INDICATEURS_MANQUANTS =
    'Indicateurs manquants:';

  private readonly OBJECTIF_COMMENTAIRE_REGEXP = new RegExp(
    String.raw`${this.OBJECTIF_COMMENTAIRE_SOURCE}\s*(.*?)(?:\s*-\s*${this.OBJECTIF_COMMENTAIRE_INDICATEURS_MANQUANTS}\s*(.*))?$`
  );
  public readonly RARE_SOURCE_ID = 'rare';

  public readonly SNBC_SOURCE: CreateIndicateurSourceType = {
    id: 'snbc',
    libelle: 'SNBC',
  };
  public readonly SNBC_SOURCE_METADONNEES: CreateIndicateurSourceMetadonneeType =
    {
      source_id: this.SNBC_SOURCE.id,
      date_version: DateTime.fromISO('2024-07-11T00:00:00', {
        zone: 'utc',
      }).toJSDate(),
      nom_donnees: 'SNBC',
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

  private indicateurSourceMetadonnee: IndicateurSourceMetadonneeType | null =
    null;

  constructor(
    private readonly collectivitesService: CollectivitesService,
    private readonly indicateursService: IndicateursService,
    private readonly indicateurSourcesService: IndicateurSourcesService,
    private readonly authService: AuthService
  ) {}

  async getTrajectoireIndicateursMetadonnees(): Promise<IndicateurSourceMetadonneeType> {
    if (!this.indicateurSourceMetadonnee) {
      // Création de la source métadonnée SNBC si elle n'existe pas
      this.indicateurSourceMetadonnee =
        await this.indicateurSourcesService.getIndicateurSourceMetadonnee(
          this.SNBC_SOURCE.id,
          this.SNBC_SOURCE_METADONNEES.date_version
        );
      if (!this.indicateurSourceMetadonnee) {
        this.logger.log(
          `Création de la metadonnée pour la source ${
            this.SNBC_SOURCE.id
          } et la date ${this.SNBC_SOURCE_METADONNEES.date_version.toISOString()}`
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
      `La metadonnée pour la source ${
        this.SNBC_SOURCE.id
      } et la date ${this.SNBC_SOURCE_METADONNEES.date_version.toISOString()} existe avec l'identifiant ${
        this.indicateurSourceMetadonnee.id
      }`
    );
    return this.indicateurSourceMetadonnee;
  }

  getObjectifCommentaire(
    donneesCalculTrajectoire: DonneesCalculTrajectoireARemplirType
  ): string {
    const identifiantsManquants = [
      ...donneesCalculTrajectoire.emissions_ges
        .identifiants_referentiel_manquants,
      ...donneesCalculTrajectoire.consommations_finales
        .identifiants_referentiel_manquants,
      ...donneesCalculTrajectoire.sequestrations
        .identifiants_referentiel_manquants,
    ];

    let commentaitre = `${this.OBJECTIF_COMMENTAIRE_SOURCE} ${donneesCalculTrajectoire.source}`;
    if (identifiantsManquants.length) {
      commentaitre += ` - ${
        this.OBJECTIF_COMMENTAIRE_INDICATEURS_MANQUANTS
      } ${identifiantsManquants.join(', ')}`;
    }

    return commentaitre;
  }
  extractSourceIdentifiantManquantsFromCommentaire(commentaire: string): {
    source: string;
    identifiants_referentiel_manquants: string[];
  } | null {
    const match = commentaire.match(this.OBJECTIF_COMMENTAIRE_REGEXP);
    if (match) {
      return {
        source: match[1],
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
    const source = forceDonneesCollectivite
      ? this.indicateursService.NULL_SOURCE_ID
      : this.RARE_SOURCE_ID;
    this.logger.log(
      `Récupération des données d'émission GES et de consommation pour la collectivité ${collectiviteId} depuis la source ${source}`
    );
    const indicateurValeursEmissionsGes =
      await this.indicateursService.getIndicateursValeurs({
        collectivite_id: collectiviteId,
        identifiants_referentiel: _.flatten(
          this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL
        ),
        sources: [source],
      });

    // Construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const donneesEmissionsGes = this.getValeursARemplirPourIdentifiants(
      this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursEmissionsGes
    );

    // Récupère les valeurs des indicateurs de consommation finale pour l'année 2015 (valeur directe ou interpolation)
    const indicateurValeursConsommationsFinales =
      await this.indicateursService.getIndicateursValeurs({
        collectivite_id: collectiviteId,
        identifiants_referentiel: _.flatten(
          this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL
        ),
        sources: [source],
      });

    // Construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const donneesConsommationsFinales = this.getValeursARemplirPourIdentifiants(
      this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursConsommationsFinales
    );

    // Récupère les valeurs des indicateurs de sequestration pour l'année 2015 (valeur directe ou interpolation)
    const indicateurValeursSequestration =
      await this.indicateursService.getIndicateursValeurs({
        collectivite_id: collectiviteId,
        identifiants_referentiel: _.flatten(
          this.SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL
        ),
        sources: [source],
      });

    // Construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const donneesSequestration = this.getValeursARemplirPourIdentifiants(
      this.SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursSequestration
    );
    return {
      source: source,
      emissions_ges: donneesEmissionsGes,
      consommations_finales: donneesConsommationsFinales,
      sequestrations: donneesSequestration,
    };
  }

  /**
   * Détermine le tableau de valeurs à insérer dans le spreadsheet.
   * Lorsqu'il y a plusieurs identifiants pour une ligne, les valeurs sont sommées.
   */
  getValeursARemplirPourIdentifiants(
    identifiantsReferentiel: string[][],
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[]
  ): DonneesARemplirResultType {
    const valeursARemplir: DonneesARemplirValeurType[] = [];
    const identifiantsReferentielManquants: string[] = [];
    identifiantsReferentiel.forEach((identifiants, index) => {
      const valeurARemplir: DonneesARemplirValeurType = {
        identifiants_referentiel: identifiants,
        valeur: 0,
        date_min: null,
        date_max: null,
      };
      valeursARemplir[index] = valeurARemplir;
      identifiants.forEach((identifiant) => {
        const identifiantIndicateurValeurs = indicateurValeurs.filter(
          (indicateurValeur) =>
            indicateurValeur.indicateur_definition?.identifiant_referentiel ===
              identifiant &&
            indicateurValeur.indicateur_valeur.resultat !== null &&
            indicateurValeur.indicateur_valeur.resultat !== undefined
        );

        const identifiantIndicateurValeur2015 =
          identifiantIndicateurValeurs.find(
            (indicateurValeur) =>
              indicateurValeur.indicateur_valeur.date_valeur ===
              this.SNBC_DATE_REFERENCE
          );
        if (
          identifiantIndicateurValeur2015 &&
          identifiantIndicateurValeur2015.indicateur_valeur.resultat !== null &&
          identifiantIndicateurValeur2015.indicateur_valeur.resultat !==
            undefined // 0 est une valeur valide
        ) {
          // Si il n'y a pas déjà eu une valeur manquante qui a placé la valeur à null
          if (valeurARemplir.valeur !== null) {
            valeurARemplir.valeur +=
              identifiantIndicateurValeur2015.indicateur_valeur.resultat;
            if (
              !valeurARemplir.date_max ||
              identifiantIndicateurValeur2015.indicateur_valeur.date_valeur >
                valeurARemplir.date_max
            ) {
              valeurARemplir.date_max =
                identifiantIndicateurValeur2015.indicateur_valeur.date_valeur;
            }
            if (
              !valeurARemplir.date_min ||
              identifiantIndicateurValeur2015.indicateur_valeur.date_valeur <
                valeurARemplir.date_min
            ) {
              valeurARemplir.date_min =
                identifiantIndicateurValeur2015.indicateur_valeur.date_valeur;
            }
          }
        } else {
          const interpolationResultat = this.getInterpolationValeur(
            identifiantIndicateurValeurs.map((v) => v.indicateur_valeur)
          );

          if (!interpolationResultat.valeur) {
            identifiantsReferentielManquants.push(identifiant);
            valeurARemplir.valeur = null;
          } else {
            // Si il n'y a pas déjà eu une valeur manquante qui a placé la valeur à null (pour un autre indicateur contribuant à la même valeur)
            if (valeurARemplir.valeur !== null) {
              valeurARemplir.valeur += interpolationResultat.valeur;
              if (
                !valeurARemplir.date_max ||
                (interpolationResultat.date_max &&
                  interpolationResultat.date_max > valeurARemplir.date_max)
              ) {
                valeurARemplir.date_max = interpolationResultat.date_max;
              }
              if (
                !valeurARemplir.date_min ||
                (interpolationResultat.date_min &&
                  interpolationResultat.date_min < valeurARemplir.date_min)
              ) {
                valeurARemplir.date_min = interpolationResultat.date_min;
              }
            }
          }
        }
      });
    });
    return {
      valeurs: valeursARemplir,
      identifiants_referentiel_manquants: identifiantsReferentielManquants,
    };
  }

  getInterpolationValeur(indicateurValeurs: IndicateurValeurType[]): {
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
        indicateurValeur.date_valeur < this.SNBC_DATE_REFERENCE &&
        (!dateAvant2015 ||
          (dateAvant2015 && indicateurValeur.date_valeur > dateAvant2015))
      ) {
        dateAvant2015 = indicateurValeur.date_valeur;
        valeurAvant2015 = indicateurValeur.resultat;
      } else if (
        indicateurValeur.date_valeur > this.SNBC_DATE_REFERENCE &&
        (!dateApres2015 ||
          (dateApres2015 && indicateurValeur.date_valeur < dateApres2015))
      ) {
        dateApres2015 = indicateurValeur.date_valeur;
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
    const { emissions_ges, consommations_finales } = donnees;
    const valeurEmissionGesValides = emissions_ges.valeurs.filter(
      (v) => v.valeur !== null
    ).length;
    const valeurConsommationFinalesValides =
      consommations_finales.valeurs.filter((v) => v.valeur !== null).length;
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
    tokenInfo: SupabaseJwtPayload,
    epci?: EpciType,
    force_recuperation_donnees = false
  ): Promise<VerificationDonneesSNBCResult> {
    // Vérification des droits
    await this.authService.verifieAccesAuxCollectivites(
      tokenInfo,
      [request.collectivite_id],
      NiveauAcces.EDITION
    );

    const response: VerificationDonneesSNBCResult = {
      status: VerificationDonneesSNBCStatus.COMMUNE_NON_SUPPORTEE,
    };

    if (request.force_recuperation_donnees) {
      force_recuperation_donnees = true;
    }

    if (!epci) {
      // Vérifie si la collectivité est une commune :
      const collectivite = await this.collectivitesService.getCollectivite(
        request.collectivite_id
      );
      if (collectivite.commune || !collectivite.epci) {
        response.status = VerificationDonneesSNBCStatus.COMMUNE_NON_SUPPORTEE;
        return response;
      }
      response.epci = collectivite.epci;
    } else {
      response.epci = epci;
    }

    // sinon, vérifie s'il existe déjà des données trajectoire SNBC calculées :
    const valeurs = await this.indicateursService.getIndicateursValeurs({
      collectivite_id: request.collectivite_id,
      sources: [this.SNBC_SOURCE.id],
    });
    if (valeurs.length > 0) {
      response.valeurs = valeurs.map((v) => v.indicateur_valeur);
      // Si jamais les données on déjà été calculées, on récupère la source depuis le commentaire
      // un peu un hack mais le plus simple aujourd'hui
      const premierCommentaire = response.valeurs[0].objectif_commentaire;
      const sourceIdentifiantManquants =
        this.extractSourceIdentifiantManquantsFromCommentaire(
          premierCommentaire || ''
        );
      response.source_donnees_entree = sourceIdentifiantManquants?.source || '';
      this.logger.log(
        `Source des données SNBC déjà calculées : ${response.source_donnees_entree}`
      );
      response.indentifiants_referentiel_manquants_donnees_entree =
        sourceIdentifiantManquants?.identifiants_referentiel_manquants || [];
      response.status = VerificationDonneesSNBCStatus.DEJA_CALCULE;
      if (!force_recuperation_donnees) {
        return response;
      }
    }
    // sinon, vérifie s'il y a les données suffisantes pour lancer le calcul :
    // Si jamais les données ont déjà été calculées et que l'on a pas défini le flag force_utilisation_donnees_collectivite, on utilise la meme source
    const donneesCalculTrajectoireARemplir =
      await this.getValeursPourCalculTrajectoire(
        request.collectivite_id,
        !isNil(request.force_utilisation_donnees_collectivite)
          ? request.force_utilisation_donnees_collectivite
          : response.source_donnees_entree ===
            this.indicateursService.NULL_SOURCE_ID
          ? true
          : false
      );

    const donneesSuffisantes = this.verificationDonneesARemplirSuffisantes(
      donneesCalculTrajectoireARemplir
    );
    response.donnees_entree = donneesCalculTrajectoireARemplir;
    // si oui, retourne 'pret a calculer'
    if (donneesSuffisantes) {
      if (response.status !== VerificationDonneesSNBCStatus.DEJA_CALCULE) {
        response.status = VerificationDonneesSNBCStatus.PRET_A_CALCULER;
      }
      return response;
    }
    // sinon, retourne 'données manquantes'
    response.status = VerificationDonneesSNBCStatus.DONNEES_MANQUANTES;
    return response;
  }

  async deleteTrajectoireSnbc(
    collectiviteId: number,
    snbcMetadonneesId?: number,
    tokenInfo?: SupabaseJwtPayload
  ): Promise<void> {
    if (!snbcMetadonneesId) {
      const indicateurSourceMetadonnee =
        await this.indicateurSourcesService.getIndicateurSourceMetadonnee(
          this.SNBC_SOURCE.id,
          this.SNBC_SOURCE_METADONNEES.date_version
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
    if (tokenInfo) {
      await this.authService.verifieAccesAuxCollectivites(
        tokenInfo,
        [collectiviteId],
        NiveauAcces.EDITION
      );
    }

    await this.indicateursService.deleteIndicateurValeurs({
      collectivite_id: collectiviteId,
      metadonnee_id: snbcMetadonneesId,
    });
  }
}
