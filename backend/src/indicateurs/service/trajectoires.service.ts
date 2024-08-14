import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Response } from 'express';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { EpciType } from '../../collectivites/models/collectivite.models';
import CollectiviteRequest from '../../collectivites/models/collectivite.request';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import { getErrorMessage } from '../../common/services/errors.helper';
import SheetService from '../../spreadsheets/services/sheet.service';
import {
  CalculTrajectoireRequest,
  CalculTrajectoireResult,
  DonneesARemplirResult,
  DonneesCalculTrajectoireARemplir,
} from '../models/calcultrajectoire.models';
import {
  CreateIndicateurSourceMetadonneeType,
  CreateIndicateurSourceType,
  CreateIndicateurValeurType,
  IndicateurAvecValeurs,
  IndicateurValeurAvecMetadonnesDefinition,
} from '../models/indicateur.models';
import {
  VerificationDonneesSNBCResponse,
  VerificationDonneesSNBCStatus,
} from '../models/verificationDonneesTrajectoire.models';
import IndicateursService from './indicateurs.service';
import IndicateurSourcesService from './indicateurSources.service';

@Injectable()
export default class TrajectoiresService {
  private readonly logger = new Logger(TrajectoiresService.name);

  private readonly SNBC_SOURCE: CreateIndicateurSourceType = {
    id: 'snbc',
    libelle: 'SNBC',
  };
  private readonly SNBC_SOURCE_METADONNEES: CreateIndicateurSourceMetadonneeType =
    {
      source_id: this.SNBC_SOURCE.id,
      date_version: DateTime.fromISO('2024-07-11T00:00:00', {
        zone: 'utc',
      }).toJSDate(),
      // nom_donnees: 'SNBC',
      // TODO diffuseur: 'ADEME',
      // TODO producteur: 'ADEME',
      // methodologie: '',
      // limites: '',
    };

  private readonly SNBC_DATE_REFERENCE = '2015-01-01';
  private readonly SNBC_SIREN_CELLULE = 'Caract_territoire!F6';
  private readonly SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL = [
    ['cae_1.c'], // B6
    ['cae_1.d'], // B7
    ['cae_1.i'], // B8
    ['cae_1.g'], // B9
    ['cae_1.e'], // B10
    ['cae_1.f'], // B11
    ['cae_1.h'], // B12
    ['cae_1.j'], // B13
  ];
  private readonly SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL = [
    ['cae_2.e'], // I29
    ['cae_2.f'], // I30
    ['cae_2.k'], // I31
    ['cae_2.i'], // I32
    ['cae_2.g', 'cae_2.h'], // I33
    ['cae_2.j'], // I34
    ['cae_2.l_pcaet'], // I35
  ];

  private readonly SNBC_EMISSIONS_GES_CELLULES = 'Carto_en-GES!D6:D13';
  private readonly SNBC_TRAJECTOIRE_RESULTAT_CELLULES =
    'TOUS SECTEURS!G253:AP262';
  private readonly SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL = [
    'cae_1.c', // 253
    'cae_1.d', // 254
    'cae_1.i', // 255
    'cae_1.g', // 256
    'cae_1.e', // 257
    'cae_1.h', // 258
    'cae_1.j', // 259
    '', // 260
    '', // 261
    'cae_1.a', // 262
  ];

  constructor(
    private readonly collectivitesService: CollectivitesService,
    private readonly indicateurSourcesService: IndicateurSourcesService,
    private readonly indicateursService: IndicateursService,
    private readonly sheetService: SheetService,
  ) {}

  getIdentifiantDossierResultat() {
    return process.env.TRAJECTOIRE_SNBC_RESULT_FOLDER_ID;
  }

  getNomFichierTrajectoire(epci: EpciType) {
    return `Trajectoire SNBC - ${epci.siren} - ${epci.nom}`;
  }

  async downloadTrajectoireSnbc(
    request: CalculTrajectoireRequest,
    res: Response,
  ) {
    // Récupère l'EPCI associé pour obtenir son SIREN
    const epci = await this.collectivitesService.getEpciByCollectiviteId(
      request.collectivite_id,
    );

    const nomFichier = this.getNomFichierTrajectoire(epci);
    let trajectoireCalculSheetId = await this.sheetService.getFileIdByName(
      nomFichier,
      this.getIdentifiantDossierResultat(),
    );

    if (!trajectoireCalculSheetId || request.reset_fichier) {
      this.logger.log(
        `Calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id} pour le téléchargement`,
      );
      const { spreadsheet_id } = await this.calculeTrajectoireSnbc(
        request,
        epci,
      );
      trajectoireCalculSheetId = spreadsheet_id;
    }

    return this.sheetService
      .downloadFile(trajectoireCalculSheetId, `${nomFichier}.xlsx`, res)
      .catch((error) => {
        this.logger.error(
          `Erreur lors du téléchargement de la trajectoire SNBC pour la collectivité ${request.collectivite_id}: ${getErrorMessage(error)}`,
          error,
        );
        res.setHeader('Content-Type', 'application/json');
        res.removeHeader('Content-Disposition');
        res.removeHeader('Content-Length');
        res.status(500).json({ message: getErrorMessage(error) });
      });
  }

  async calculeTrajectoireSnbc(
    request: CalculTrajectoireRequest,
    epci?: EpciType,
  ): Promise<CalculTrajectoireResult> {
    // Récupère l'EPCI associé pour obtenir son SIREN
    if (!epci) {
      epci = await this.collectivitesService.getEpciByCollectiviteId(
        request.collectivite_id,
      );
    }

    // Création de la source métadonnée SNBC si elle n'existe pas
    let indicateurSourceMetadonnee =
      await this.indicateurSourcesService.getIndicateurSourceMetadonnee(
        this.SNBC_SOURCE.id,
        this.SNBC_SOURCE_METADONNEES.date_version,
      );
    if (!indicateurSourceMetadonnee) {
      this.logger.log(
        `Création de la metadonnée pour la source ${this.SNBC_SOURCE.id} et la date ${this.SNBC_SOURCE_METADONNEES.date_version.toISOString()}`,
      );
      await this.indicateurSourcesService.upsertIndicateurSource(
        this.SNBC_SOURCE,
      );

      indicateurSourceMetadonnee =
        await this.indicateurSourcesService.createIndicateurSourceMetadonnee(
          this.SNBC_SOURCE_METADONNEES,
        );
    }
    this.logger.log(
      `La metadonnée pour la source ${this.SNBC_SOURCE.id} et la date ${this.SNBC_SOURCE_METADONNEES.date_version.toISOString()} existe avec l'identifiant ${indicateurSourceMetadonnee.id}`,
    );

    // Récupère les valeurs des indicateurs pour l'année 2015
    const donneesCalculTrajectoireARemplir =
      await this.getValeursPourCalculTrajectoire(request.collectivite_id);

    const donneesSuffisantes = this.verificationDonneesARemplirSuffisantes(
      donneesCalculTrajectoireARemplir,
    );
    if (!donneesSuffisantes) {
      const identifiantsReferentielManquants = [
        ...donneesCalculTrajectoireARemplir.emissionsGes
          .identifiantsReferentielManquants,
        ...donneesCalculTrajectoireARemplir.consommationsFinales
          .identifiantsReferentielManquants,
      ];
      throw new UnprocessableEntityException(
        `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 : ${identifiantsReferentielManquants.join(', ')}, impossible de calculer la trajectoire SNBC.`,
      );
    }

    if (!process.env.TRAJECTOIRE_SNBC_SHEET_ID) {
      throw new InternalServerErrorException(
        "L'identifiant de la feuille de calcul pour les trajectoires SNBC est manquante",
      );
    }

    const nomFichier = this.getNomFichierTrajectoire(epci);
    let trajectoireCalculSheetId = await this.sheetService.getFileIdByName(
      nomFichier,
      process.env.TRAJECTOIRE_SNBC_RESULT_FOLDER_ID,
    );
    if (trajectoireCalculSheetId && !request.reset_fichier) {
      this.logger.log(
        `Fichier de trajectoire SNBC trouvé avec l'identifiant ${trajectoireCalculSheetId}`,
      );
    } else {
      if (trajectoireCalculSheetId) {
        this.logger.log(
          `Suppression du fichier de trajectoire SNBC existant ayant l'identifiant ${trajectoireCalculSheetId}`,
        );
        await this.sheetService.deleteFile(trajectoireCalculSheetId);
      }
      trajectoireCalculSheetId = await this.sheetService.copyFile(
        process.env.TRAJECTOIRE_SNBC_SHEET_ID,
        nomFichier,
        process.env.TRAJECTOIRE_SNBC_RESULT_FOLDER_ID
          ? [process.env.TRAJECTOIRE_SNBC_RESULT_FOLDER_ID]
          : undefined,
      );
      this.logger.log(
        `Fichier de trajectoire SNBC créé à partir du master ${process.env.TRAJECTOIRE_SNBC_SHEET_ID} avec l'identifiant ${trajectoireCalculSheetId}`,
      );
    }

    // Ecriture du SIREN
    const sirenNumber = parseInt(epci.siren || '');
    if (isNaN(sirenNumber)) {
      throw new InternalServerErrorException(
        `Le SIREN de l'EPCI ${epci.nom} (${epci.siren}) n'est pas un nombre`,
      );
    }

    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.SNBC_SIREN_CELLULE,
      [[sirenNumber]],
    );

    // Ecriture des informations d'émission GES
    const spreadsheetData =
      donneesCalculTrajectoireARemplir.emissionsGes.valeursARemplir.map(
        (valeur) => [valeur || 0],
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.SNBC_EMISSIONS_GES_CELLULES,
      spreadsheetData,
    );

    const trajectoireCalculResultat =
      await this.sheetService.getRawDataFromSheet(
        trajectoireCalculSheetId,
        this.SNBC_TRAJECTOIRE_RESULTAT_CELLULES,
      );

    const indicateurResultatDefinitions =
      await this.indicateursService.getReferentielIndicateurDefinitions(
        this.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL,
      );
    const indicateurValeursResultat: CreateIndicateurValeurType[] = [];
    const indicateursAvecValeurs: IndicateurAvecValeurs[] = [];
    trajectoireCalculResultat.data?.forEach((ligne, ligneIndex) => {
      const identifiantReferentiel =
        this.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL[ligneIndex];
      if (identifiantReferentiel) {
        const indicateurResultatDefinition = indicateurResultatDefinitions.find(
          (definition) =>
            definition.identifiant_referentiel === identifiantReferentiel,
        );
        if (indicateurResultatDefinition) {
          const indicateurAvecValeurs: IndicateurAvecValeurs = {
            definition: indicateurResultatDefinition,
            valeurs: [],
          };
          indicateursAvecValeurs.push(indicateurAvecValeurs);

          ligne.forEach((valeur, columnIndex) => {
            const floatValeur = parseFloat(valeur);
            if (!isNaN(floatValeur)) {
              const indicateurValeur: CreateIndicateurValeurType = {
                indicateur_id: indicateurResultatDefinition.id,
                collectivite_id: request.collectivite_id,
                metadonnee_id: indicateurSourceMetadonnee.id,
                date_valeur: `${2015 + columnIndex}-01-01`,
                objectif: floatValeur,
              };
              indicateurValeursResultat.push(indicateurValeur);
            } else {
              this.logger.warn(
                `Valeur non numérique ${valeur} pour la ligne ${ligneIndex} et la colonne ${columnIndex} de la plage ${this.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL}`,
              );
            }
          });
        } else {
          this.logger.warn(`Indicateur ${identifiantReferentiel} non trouvé`);
        }
      }
    });
    this.logger.log(
      `Ecriture des ${indicateurValeursResultat.length} valeurs des indicateurs correspondant à la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    const upsertedIndicateurValeurs =
      await this.indicateursService.upsertIndicateurValeurs(
        indicateurValeursResultat,
      );
    upsertedIndicateurValeurs?.forEach((v) => {
      const indicateurAvecValeurs = indicateursAvecValeurs.find(
        (indicateur) => indicateur.definition.id === v.indicateur_id,
      );
      if (indicateurAvecValeurs) {
        indicateurAvecValeurs.valeurs.push(v);
      }
    });

    const result: CalculTrajectoireResult = {
      spreadsheet_id: trajectoireCalculSheetId,
      trajectoire: indicateursAvecValeurs,
    };
    return result;
  }

  /**
   * Récupère les valeurs nécessaires pour calculer la trajectoire SNBC
   * @param collectiviteId Identifiant de la collectivité
   * @return
   */
  async getValeursPourCalculTrajectoire(
    collectiviteId: number,
  ): Promise<DonneesCalculTrajectoireARemplir> {
    // Récupère les valeurs des indicateurs d'émission pour l'année 2015
    const indicateurValeursEmissionsGes =
      await this.indicateursService.getIndicateursValeurs({
        collectiviteId,
        identifiantsReferentiel: _.flatten(
          this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
        ),
        dateDebut: this.SNBC_DATE_REFERENCE,
        dateFin: this.SNBC_DATE_REFERENCE,
      });

    // Vérifie que toutes les données sont dispo et construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const donneesEmissionsGes = this.getValeursARemplirPourIdentifiants(
      this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursEmissionsGes,
    );

    // Récupère les valeurs des indicateurs de consommation finale pour l'année 2015
    const indicateurValeursConsommationsFinales =
      await this.indicateursService.getIndicateursValeurs({
        collectiviteId,
        identifiantsReferentiel: _.flatten(
          this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL,
        ),
        dateDebut: this.SNBC_DATE_REFERENCE,
        dateFin: this.SNBC_DATE_REFERENCE,
      });

    // Vérifie que toutes les données sont dispo et construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const donneesConsommationsFinales = this.getValeursARemplirPourIdentifiants(
      this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursConsommationsFinales,
    );
    return {
      emissionsGes: donneesEmissionsGes,
      consommationsFinales: donneesConsommationsFinales,
    };
  }

  /**
   * Détermine le tableau de valeurs à insérer dans le spreadsheet.
   * Lorsqu'il y a plusieurs identifiants pour une ligne, les valeurs sont sommées.
   */
  getValeursARemplirPourIdentifiants(
    identifiantsReferentiel: string[][],
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[],
  ): DonneesARemplirResult {
    const valeursARemplir: (number | null)[] = [];
    const identifiantsReferentielManquants: string[] = [];
    identifiantsReferentiel.forEach((identifiants, index) => {
      valeursARemplir[index] = 0;
      identifiants.forEach((identifiant) => {
        const indicateurValeur = indicateurValeurs.find(
          (indicateurValeur) =>
            indicateurValeur.indicateur_definition?.identifiant_referentiel ===
              identifiant &&
            indicateurValeur.indicateur_valeur.resultat !== null &&
            indicateurValeur.indicateur_valeur.resultat !== undefined,
        );
        if (
          indicateurValeur &&
          indicateurValeur.indicateur_valeur.resultat !== null &&
          indicateurValeur.indicateur_valeur.resultat !== undefined // 0 est une valeur valide
        ) {
          if (valeursARemplir[index] !== null) {
            // les valeurs à remplir doivent être en ktCO2 et les données dans la plateforme sont en tCO2
            valeursARemplir[index] +=
              indicateurValeur.indicateur_valeur.resultat / 1000;
          }
        } else {
          identifiantsReferentielManquants.push(identifiant);
          valeursARemplir[index] = null;
        }
      });
    });
    return { valeursARemplir, identifiantsReferentielManquants };
  }

  verificationDonneesARemplirSuffisantes(
    donnees: DonneesCalculTrajectoireARemplir,
  ): boolean {
    const { emissionsGes, consommationsFinales } = donnees;
    const valeurEmissionGesValides = emissionsGes.valeursARemplir.filter(
      (v) => v !== null,
    ).length;
    const valeurConsommationFinalesValides =
      consommationsFinales.valeursARemplir.filter((v) => v !== null).length;
    return (
      valeurEmissionGesValides >= 4 && valeurConsommationFinalesValides >= 5
    );
  }

  /**
   * Vérifie si la collectivité concernée est une epci et à déjà fait les calculs,
   * ou a les données nécessaires pour lancer le calcul de trajectoire SNBC
   * @param request
   * @return le statut pour déterminer la page à afficher TODO format statut
   */
  async verificationDonneesSnbc(
    request: CollectiviteRequest,
  ): Promise<VerificationDonneesSNBCResponse> {
    const response: VerificationDonneesSNBCResponse = {
      status: VerificationDonneesSNBCStatus.COMMUNE_NON_SUPPORTEE,
    };

    // Vérifie si la collectivité est une commune :
    const collectivite = await this.collectivitesService.getCollectivite(
      request.collectivite_id,
    );
    if (collectivite.commune || !collectivite.epci) {
      response.status = VerificationDonneesSNBCStatus.COMMUNE_NON_SUPPORTEE;
      return response;
    }

    response.epci = collectivite.epci;

    // sinon, vérifie s'il existe déjà des données trajectoire SNBC calculées :
    const valeurs = await this.indicateursService.getIndicateursValeurs({
      collectiviteId: request.collectivite_id,
      sourceId: this.SNBC_SOURCE.id,
    });
    if (valeurs.length > 0) {
      response.status = VerificationDonneesSNBCStatus.DEJA_CALCULE;
      return response;
    }
    // sinon, vérifie s'il y a les données suffisantes pour lancer le calcul :
    const { emissionsGes } = await this.getValeursPourCalculTrajectoire(
      request.collectivite_id,
    );
    // si oui, retourne 'pret a calculer'
    if (emissionsGes.identifiantsReferentielManquants.length == 0) {
      response.status = VerificationDonneesSNBCStatus.PRET_A_CALCULER;
      return response;
    }
    // sinon, retourne 'données manquantes'
    response.status = VerificationDonneesSNBCStatus.DONNEES_MANQUANTES;
    return response;
  }
}
