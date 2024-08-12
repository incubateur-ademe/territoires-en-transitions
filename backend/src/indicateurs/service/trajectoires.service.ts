import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import SheetService from '../../spreadsheets/services/sheet.service';
import CalculTrajectoireRequest from '../models/calcultrajectoire.request';
import IndicateursService from './indicateurs.service';
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
  private readonly SNBC_EMISSIONS_GES_CELLULES = 'Carto_en-GES!B6:B13';
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

  async calculeTrajectoireSnbc(request: CalculTrajectoireRequest) {
    // Récupère l'EPCI associé pour obtenir son SIREN
    const epci = await this.collectivitesService.getEpciByCollectiviteId(
      request.collectivite_id,
    );

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
    const indicateurValeurs =
      await this.indicateursService.getReferentielIndicateursValeurs(
        request.collectivite_id,
        this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL,
        this.SNBC_DATE_REFERENCE,
        this.SNBC_DATE_REFERENCE,
      );

    // Vérifie que toutes les données sont dispo et construit le tableau de valeurs à insérer dans le fichier Spreadsheet
    const valeursARemplir: number[] = [];
    const identifiantsReferentielManquants: string[] = [];
    this.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL.forEach((identifiant) => {
      const indicateurValeur = indicateurValeurs.find(
        (indicateurValeur) =>
          indicateurValeur.indicateur_definition?.identifiant_referentiel ===
          identifiant,
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

    const nomFichier = `Trajectoire SNBC - ${epci.siren} - ${epci.nom}`;
    // TODO: récupérer si le fichier existe déjà et le réutiliser sauf si on force ?
    const trajectoireCalculSheetId = await this.sheetService.copyFile(
      process.env.TRAJECTOIRE_SNBC_SHEET_ID,
      nomFichier,
    );
    this.logger.log(
      `Fichier de trajectoire SNBC créé à partir du master ${process.env.TRAJECTOIRE_SNBC_SHEET_ID} avec l'identifiant ${trajectoireCalculSheetId}`,
    );

    // Ecriture du SIREN
    const sirenNulber = parseInt(epci.siren || '');
    if (isNaN(sirenNulber)) {
      throw new InternalServerErrorException(
        `Le SIREN de l'EPCI ${epci.nom} (${epci.siren}) n'est pas un nombre`,
      );
    }

    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.SNBC_SIREN_CELLULE,
      [[sirenNulber]],
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

    if (!request.conserve_fichier_temporaire) {
      await this.sheetService.deleteFile(trajectoireCalculSheetId);
    }

    // TODO: type it
    const indicateurValeursResultat: any[] = [];
    trajectoireCalculResultat.data?.forEach((ligne, index) => {
      const identifiantReferentiel =
        this.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL[index];
      if (identifiantReferentiel) {
        ligne.forEach((valeur, index) => {
          indicateurValeursResultat.push({
            identifiant_referentiel: identifiantReferentiel,
            date_valeur: `${2015 + index}-01-01`,
            resultat: valeur,
          });
        });
      }
    });

    return indicateurValeursResultat;
  }
}
