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
  CalculTrajectoireReset,
  CalculTrajectoireResult,
  CalculTrajectoireResultatMode,
  DonneesARemplirResult,
  DonneesCalculTrajectoireARemplir,
} from '../models/calcultrajectoire.models';
import {
  CreateIndicateurSourceMetadonneeType,
  CreateIndicateurSourceType,
  CreateIndicateurValeurType,
  IndicateurDefinitionType,
  IndicateurValeurAvecMetadonnesDefinition,
} from '../models/indicateur.models';
import {
  VerificationDonneesSNBCResult,
  VerificationDonneesSNBCStatus,
} from '../models/verificationDonneesTrajectoire.models';
import IndicateursService from './indicateurs.service';
import IndicateurSourcesService from './indicateurSources.service';

@Injectable()
export default class TrajectoiresService {
  private readonly logger = new Logger(TrajectoiresService.name);

  private readonly RARE_SOURCE_ID = 'rare';

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
  private readonly SNBC_EMISSIONS_GES_CELLULES = 'Carto_en-GES!D6:D13';
  private readonly SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL = [
    ['cae_2.e'], // I29
    ['cae_2.f'], // I30
    ['cae_2.k'], // I31
    ['cae_2.i'], // I32
    ['cae_2.g', 'cae_2.h'], // I33
    ['cae_2.j'], // I34
    ['cae_2.l_pcaet'], // I35
  ];
  private readonly SNBC_CONSOMMATIONS_CELLULES = 'Carto_en-GES!I29:I35';

  private readonly SNBC_TRAJECTOIRE_RESULTAT_EMISSIONS_GES_CELLULES =
    'TOUS SECTEURS!G268:AP279';
  private readonly SNBC_TRAJECTOIRE_RESULTAT_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL =
    [
      'cae_1.c', // 268 Résidentiel
      'cae_1.d', // 269 Tertiaire
      'cae_1.i', // 270 Industrie
      'cae_1.g', // 271 Agriculture
      'cae_1.e', // 272 Transports
      'cae_1.h', // 273 Déchets
      'cae_1.j', // 274 Branche énergie
      'cae_63.a', // 227 UTCATF
      'cae_1.csc', // 276 CSC
      'cae_1.aa', // 277 Total net
      '', // 278
      'cae_1.a', // 279 Total brut
    ];

  private readonly SNBC_TRAJECTOIRE_RESULTAT_CONSOMMATION_CELLULES =
    'TOUS SECTEURS!G290:AP297';
  private readonly SNBC_TRAJECTOIRE_RESULTAT_CONSOMMATION_IDENTIFIANTS_REFERENTIEL =
    [
      'cae_2.k', // 290 Industrie
      'cae_2.m', // 291 Transports
      'cae_2.e', // 292 Résidentiel
      'cae_2.f', // 293 Tertiaire
      'cae_2.i', // 294 Agriculture
      'cae_2.j', // 295 Déchets
      'cae_2.l_pcaet', // 296 Branche énergie
      'cae_2.a', // 297 Total
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

    if (
      !trajectoireCalculSheetId ||
      request.mode === CalculTrajectoireReset.NOUVEAU_SPREADSHEET ||
      request.mode === CalculTrajectoireReset.MAJ_SPREADSHEET_EXISTANT
    ) {
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
    let mode: CalculTrajectoireResultatMode =
      CalculTrajectoireResultatMode.NOUVEAU_SPREADSHEET;

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

    const resultatVerification = await this.verificationDonneesSnbc(
      request,
      epci,
      true,
    );

    if (
      resultatVerification.status ===
        VerificationDonneesSNBCStatus.COMMUNE_NON_SUPPORTEE ||
      !resultatVerification.epci
    ) {
      throw new UnprocessableEntityException(
        `Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI.`,
      );
    } else if (
      resultatVerification.status ===
        VerificationDonneesSNBCStatus.DONNEES_MANQUANTES ||
      !resultatVerification.donnees_entree
    ) {
      const identifiantsReferentielManquants = [
        ...(resultatVerification.donnees_entree?.emissions_ges
          .identifiants_referentiel_manquants || []),
        ...(resultatVerification.donnees_entree?.consommations_finales
          .identifiants_referentiel_manquants || []),
      ];
      throw new UnprocessableEntityException(
        `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 : ${identifiantsReferentielManquants.join(', ')}, impossible de calculer la trajectoire SNBC.`,
      );
    } else if (
      resultatVerification.status ===
        VerificationDonneesSNBCStatus.DEJA_CALCULE &&
      resultatVerification.valeurs &&
      resultatVerification.epci &&
      request.mode !== CalculTrajectoireReset.NOUVEAU_SPREADSHEET && // L'utilisateur veut recréer un nouveau spreadsheet de calcul, on ne retourne pas les résultats existants
      request.mode !== CalculTrajectoireReset.MAJ_SPREADSHEET_EXISTANT // L'utilisateur veut mettre à jour le spreadsheet de calcul existant, on ne retourne pas les résultats existants
    ) {
      this.logger.log(
        `Résultats de la trajectoire SNBC déjà calculés, lecture des données en base (request mode: ${request.mode})`,
      );
      const trajectoireCalculSheetId = await this.sheetService.getFileIdByName(
        this.getNomFichierTrajectoire(resultatVerification.epci),
        this.getIdentifiantDossierResultat(),
      );
      if (trajectoireCalculSheetId) {
        const indicateurEmissionsDefinitions =
          await this.indicateursService.getReferentielIndicateurDefinitions(
            this
              .SNBC_TRAJECTOIRE_RESULTAT_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
          );
        const emissionGesTrajectoire =
          this.indicateursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurEmissionsDefinitions,
          );

        const indicateurConsommationDefinitions =
          await this.indicateursService.getReferentielIndicateurDefinitions(
            this
              .SNBC_TRAJECTOIRE_RESULTAT_CONSOMMATION_IDENTIFIANTS_REFERENTIEL,
          );
        const consommationsTrajectoire =
          this.indicateursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurConsommationDefinitions,
          );

        mode = CalculTrajectoireResultatMode.DONNEES_EN_BDD;
        const result: CalculTrajectoireResult = {
          mode: mode,
          spreadsheet_id: trajectoireCalculSheetId,
          trajectoire: {
            emissions_ges: emissionGesTrajectoire,
            consommations_finales: consommationsTrajectoire,
          },
        };

        return result;
      }
    }
    epci = resultatVerification.epci;

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
    if (
      trajectoireCalculSheetId &&
      request.mode !== CalculTrajectoireReset.NOUVEAU_SPREADSHEET
    ) {
      mode = CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT;
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
    // les valeurs à remplir doivent être en ktCO2 et les données dans la plateforme sont en tCO2
    const emissionGesSpreadsheetData =
      resultatVerification.donnees_entree.emissions_ges.valeurs.map(
        (valeur) => [(valeur.valeur || 0) / 1000],
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.SNBC_EMISSIONS_GES_CELLULES,
      emissionGesSpreadsheetData,
    );

    // Ecriture des informations de consommation finales
    const consommationSpreadsheetData =
      resultatVerification.donnees_entree.consommations_finales.valeurs.map(
        (valeur) => [valeur.valeur || 0],
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.SNBC_CONSOMMATIONS_CELLULES,
      consommationSpreadsheetData,
    );

    const indicateurResultatDefinitions =
      await this.indicateursService.getReferentielIndicateurDefinitions([
        ...this
          .SNBC_TRAJECTOIRE_RESULTAT_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
        ...this.SNBC_TRAJECTOIRE_RESULTAT_CONSOMMATION_IDENTIFIANTS_REFERENTIEL,
      ]);

    const trajectoireCalculEmissionGesResultat =
      await this.sheetService.getRawDataFromSheet(
        trajectoireCalculSheetId,
        this.SNBC_TRAJECTOIRE_RESULTAT_EMISSIONS_GES_CELLULES,
      );

    const indicateurValeursEmissionGesResultat =
      this.getIndicateurValeursACreer(
        request.collectivite_id,
        indicateurSourceMetadonnee.id,
        trajectoireCalculEmissionGesResultat.data,
        this.SNBC_TRAJECTOIRE_RESULTAT_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
        indicateurResultatDefinitions,
        resultatVerification.donnees_entree.emissions_ges,
      );

    this.logger.log(
      `Ecriture des ${indicateurValeursEmissionGesResultat.length} valeurs des indicateurs correspondant aux emissions GES de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    const upsertedEmissionGesIndicateurValeurs =
      await this.indicateursService.upsertIndicateurValeurs(
        indicateurValeursEmissionGesResultat,
      );

    const emissionGesTrajectoire =
      this.indicateursService.groupeIndicateursValeursParIndicateur(
        upsertedEmissionGesIndicateurValeurs || [],
        indicateurResultatDefinitions,
      );

    const trajectoireCalculConsommationsResultat =
      await this.sheetService.getRawDataFromSheet(
        trajectoireCalculSheetId,
        this.SNBC_TRAJECTOIRE_RESULTAT_CONSOMMATION_CELLULES,
      );

    const indicateurValeursConsommationsResultat =
      this.getIndicateurValeursACreer(
        request.collectivite_id,
        indicateurSourceMetadonnee.id,
        trajectoireCalculConsommationsResultat.data,
        this.SNBC_TRAJECTOIRE_RESULTAT_CONSOMMATION_IDENTIFIANTS_REFERENTIEL,
        indicateurResultatDefinitions,
        resultatVerification.donnees_entree.consommations_finales,
      );

    this.logger.log(
      `Ecriture des ${indicateurValeursConsommationsResultat.length} valeurs des indicateurs correspondant aux consommations finales de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    const upsertedConsommationsIndicateurValeurs =
      await this.indicateursService.upsertIndicateurValeurs(
        indicateurValeursConsommationsResultat,
      );

    const consommationsTrajectoire =
      this.indicateursService.groupeIndicateursValeursParIndicateur(
        upsertedConsommationsIndicateurValeurs || [],
        indicateurResultatDefinitions,
      );

    const result: CalculTrajectoireResult = {
      mode: mode,
      spreadsheet_id: trajectoireCalculSheetId,
      trajectoire: {
        emissions_ges: emissionGesTrajectoire,
        consommations_finales: consommationsTrajectoire,
      },
    };
    return result;
  }

  getIndicateurValeursACreer(
    collectiviteId: number,
    indicateurSourceMetadonneeId: number,
    donneesSpreadsheet: any[][] | null,
    identifiantsReferentielAssocie: string[],
    indicateurResultatDefinitions: IndicateurDefinitionType[],
    donneesEntree: DonneesARemplirResult,
  ): CreateIndicateurValeurType[] {
    const indicateurValeursResultat: CreateIndicateurValeurType[] = [];
    donneesSpreadsheet?.forEach((ligne, ligneIndex) => {
      const identifiantReferentiel = identifiantsReferentielAssocie[ligneIndex];
      if (identifiantReferentiel) {
        const valeurEntree = donneesEntree.valeurs.find((v) =>
          v.identifiants_referentiel.includes(identifiantReferentiel),
        );
        // TODO: exception pour les totaux?
        if (
          !valeurEntree ||
          donneesEntree.identifiants_referentiel_manquants.includes(
            identifiantReferentiel,
          )
        ) {
          this.logger.log(
            `Indicateur ${identifiantReferentiel} manquant en entrée, résultats ignorés`,
          );
        } else {
          const indicateurResultatDefinition =
            indicateurResultatDefinitions.find(
              (definition) =>
                definition.identifiant_referentiel === identifiantReferentiel,
            );
          if (indicateurResultatDefinition) {
            ligne.forEach((valeur, columnIndex) => {
              const floatValeur = parseFloat(valeur);
              if (!isNaN(floatValeur)) {
                const indicateurValeur: CreateIndicateurValeurType = {
                  indicateur_id: indicateurResultatDefinition.id,
                  collectivite_id: collectiviteId,
                  metadonnee_id: indicateurSourceMetadonneeId,
                  date_valeur: `${2015 + columnIndex}-01-01`,
                  objectif: floatValeur,
                };
                indicateurValeursResultat.push(indicateurValeur);
              } else {
                this.logger.warn(
                  `Valeur non numérique ${valeur} pour la ligne ${ligneIndex} et la colonne ${columnIndex} de la plage ${this.SNBC_TRAJECTOIRE_RESULTAT_EMISSIONS_GES_CELLULES}`,
                );
              }
            });
          } else {
            this.logger.warn(`Indicateur ${identifiantReferentiel} non trouvé`);
          }
        }
      }
    });
    return indicateurValeursResultat;
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
        sourceId: this.RARE_SOURCE_ID,
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
        sourceId: this.RARE_SOURCE_ID,
        dateDebut: this.SNBC_DATE_REFERENCE,
        dateFin: this.SNBC_DATE_REFERENCE,
      });

    // Vérifie que toutes les données sont dispo et construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const donneesConsommationsFinales = this.getValeursARemplirPourIdentifiants(
      this.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL,
      indicateurValeursConsommationsFinales,
    );
    return {
      emissions_ges: donneesEmissionsGes,
      consommations_finales: donneesConsommationsFinales,
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
    const valeursARemplir: {
      identifiants_referentiel: string[];
      valeur: number | null;
    }[] = [];
    const identifiantsReferentielManquants: string[] = [];
    identifiantsReferentiel.forEach((identifiants, index) => {
      valeursARemplir[index] = {
        identifiants_referentiel: identifiants,
        valeur: 0,
      };
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
          /*console.log(
            `${identifiant}: ${indicateurValeur.indicateur_valeur.resultat} ${indicateurValeur.indicateur_definition?.unite}`,
          );*/

          // Si il n'y a pas déjà eu une valeur manquante qui a placé la valeur à null
          if (valeursARemplir[index].valeur !== null) {
            valeursARemplir[index].valeur +=
              indicateurValeur.indicateur_valeur.resultat;
          }
        } else {
          identifiantsReferentielManquants.push(identifiant);
          valeursARemplir[index].valeur = null;
        }
      });
    });
    return {
      valeurs: valeursARemplir,
      identifiants_referentiel_manquants: identifiantsReferentielManquants,
    };
  }

  verificationDonneesARemplirSuffisantes(
    donnees: DonneesCalculTrajectoireARemplir,
  ): boolean {
    const { emissions_ges, consommations_finales } = donnees;
    const valeurEmissionGesValides = emissions_ges.valeurs.filter(
      (v) => v.valeur !== null,
    ).length;
    const valeurConsommationFinalesValides =
      consommations_finales.valeurs.filter((v) => v.valeur !== null).length;
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
    epci?: EpciType,
    force_recuperation_donnees = false,
  ): Promise<VerificationDonneesSNBCResult> {
    const response: VerificationDonneesSNBCResult = {
      status: VerificationDonneesSNBCStatus.COMMUNE_NON_SUPPORTEE,
    };

    if (!epci) {
      // Vérifie si la collectivité est une commune :
      const collectivite = await this.collectivitesService.getCollectivite(
        request.collectivite_id,
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
      collectiviteId: request.collectivite_id,
      sourceId: this.SNBC_SOURCE.id,
    });
    if (valeurs.length > 0) {
      response.valeurs = valeurs.map((v) => v.indicateur_valeur);
      response.status = VerificationDonneesSNBCStatus.DEJA_CALCULE;
      if (!force_recuperation_donnees) {
        return response;
      }
    }
    // sinon, vérifie s'il y a les données suffisantes pour lancer le calcul :
    const donneesCalculTrajectoireARemplir =
      await this.getValeursPourCalculTrajectoire(request.collectivite_id);

    const donneesSuffisantes = this.verificationDonneesARemplirSuffisantes(
      donneesCalculTrajectoireARemplir,
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
}
