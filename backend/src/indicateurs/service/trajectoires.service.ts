import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Response } from 'express';
import { DateTime } from 'luxon';
import CollectiviteRequest from '../../collectivites/models/collectivite.request';
import CollectivitesService, {
  EpciType,
} from '../../collectivites/services/collectivites.service';
import { getErrorMessage } from '../../common/services/errors.helper';
import SheetService from '../../spreadsheets/services/sheet.service';
import CalculTrajectoireRequest from '../models/calcultrajectoire.request';
import { CheckDataSNBCStatus } from '../models/enums.models';
import IndicateursService, {
  CreateIndicateurValeurType,
} from './indicateurs.service';
import IndicateurSourcesService, {
  CreateIndicateurSourceMetadonneeType,
  CreateIndicateurSourceType,
} from './indicateurSources.service';

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
    'cae_1.c', // B6
    'cae_1.d', // B7
    'cae_1.i', // B8
    'cae_1.g', // B9
    'cae_1.e', // B10
    'cae_1.f', // B11
    'cae_1.h', // B12
    'cae_1.j', // B13
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
      const { trajectoireCalculSheetId: nouveauTrajectoireCalculSheetId } =
        await this.calculeTrajectoireSnbc(request, epci);
      trajectoireCalculSheetId = nouveauTrajectoireCalculSheetId;
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
  ) {
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
    const { identifiantsReferentielManquants, valeursARemplir } =
      await this.getValeursPourSNBC(request.collectivite_id);

    if (identifiantsReferentielManquants.length > 0) {
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

    // Ecriture des informations d'émission
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.SNBC_EMISSIONS_GES_CELLULES,
      valeursARemplir.map((valeur) => [valeur]),
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
    trajectoireCalculResultat.data?.forEach((ligne, ligneIndex) => {
      const identifiantReferentiel =
        this.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL[ligneIndex];
      if (identifiantReferentiel) {
        const indicateurResultatDefinition = indicateurResultatDefinitions.find(
          (definition) =>
            definition.identifiant_referentiel === identifiantReferentiel,
        );
        if (indicateurResultatDefinition) {
          ligne.forEach((valeur, columnIndex) => {
            const floatValeur = parseFloat(valeur);
            if (!isNaN(floatValeur)) {
              indicateurValeursResultat.push({
                indicateur_id: indicateurResultatDefinition.id,
                collectivite_id: request.collectivite_id,
                metadonnee_id: indicateurSourceMetadonnee.id,
                date_valeur: `${2015 + columnIndex}-01-01`,
                objectif: floatValeur,
              });
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
    await this.indicateursService.upsertIndicateurValeurs(
      indicateurValeursResultat,
    );

    return { trajectoireCalculSheetId, indicateurValeursResultat };
  }

  /**
   * Récupère les valeurs nécessaires pour calculer la trajectoire SNBC
   * @param collectiviteId Identifiant de la collectivité
   * @return
   * - identifiantReferentielManquant - Identifiants référentiels des indicateurs dont la valeur est manquante
   * - valeursARemplir - TODO ?
   */
  async getValeursPourSNBC(collectiviteId: number) {
    // Récupère les valeurs des indicateurs pour l'année 2015
    const indicateurValeurs =
      await this.indicateursService.getIndicateursValeurs({
        collectiviteId,
        identifiantsReferentiel:
          this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
        dateDebut: this.SNBC_DATE_REFERENCE,
        dateFin: this.SNBC_DATE_REFERENCE,
      });

    // Vérifie que toutes les données sont dispo et construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const valeursARemplir: number[] = [];
    const identifiantsReferentielManquants: string[] = [];
    this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL.forEach((identifiant) => {
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
        valeursARemplir.push(
          indicateurValeur.indicateur_valeur.resultat / 1000,
        );
      } else {
        identifiantsReferentielManquants.push(identifiant);
        valeursARemplir.push(0);
      }
    });
    return { valeursARemplir, identifiantsReferentielManquants };
  }

  /**
   * Vérifie si la collectivité concernée est une epci et à déjà fait les calculs,
   * ou a les données nécessaires pour lancer le calcul de trajectoire SNBC
   * @param request
   * @return le statut pour déterminer la page à afficher TODO format statut
   */
  async checkDataSnbc(
    request: CollectiviteRequest,
  ): Promise<{ status: CheckDataSNBCStatus }> {
    // Vérifie si la collectivité est une commune :
    // TODO: créer une autre fonction pour ne pas partir en exception
    try {
      await this.collectivitesService.getEpciByCollectiviteId(
        request.collectivite_id,
      );
    } catch (error) {
      return { status: CheckDataSNBCStatus.COMMUNE_NON_SUPPORTEE };
    }
    // sinon, vérifie s'il existe déjà des données trajectoire SNBC calculées :
    const valeurs = await this.indicateursService.getIndicateursValeurs({
      collectiviteId: request.collectivite_id,
      sourceId: this.SNBC_SOURCE.id,
    });
    if (valeurs.length > 0) {
      return { status: CheckDataSNBCStatus.DEJA_CALCULE };
    }
    // sinon, vérifie s'il y a les données suffisantes pour lancer le calcul :
    const { identifiantsReferentielManquants } = await this.getValeursPourSNBC(
      request.collectivite_id,
    );
    // si oui, retourne 'pret a calculer'
    if (identifiantsReferentielManquants.length == 0) {
      return { status: CheckDataSNBCStatus.PRET_A_CALCULER };
    }
    // sinon, retourne 'données manquantes'
    return { status: CheckDataSNBCStatus.DONNEES_MANQUANTES };
  }
}
