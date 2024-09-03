import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { isNil, partition } from 'es-toolkit';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import { EpciType } from '../../collectivites/models/collectivite.models';
import GroupementsService from '../../collectivites/services/groupements.service';
import SheetService from '../../spreadsheets/services/sheet.service';
import {
  CalculTrajectoireRequestType,
  CalculTrajectoireReset,
  CalculTrajectoireResultType,
  CalculTrajectoireResultatMode,
  DonneesCalculTrajectoireARemplirType,
  VerificationDonneesSNBCStatus,
} from '../models/calcultrajectoire.models';
import {
  CreateIndicateurValeurType,
  IndicateurDefinitionType,
} from '../models/indicateur.models';
import IndicateursService from './indicateurs.service';
import IndicateurSourcesService from './indicateurSources.service';
import TrajectoiresDataService from './trajectoires-data.service';

@Injectable()
export default class TrajectoiresSpreadsheetService {
  private readonly logger = new Logger(TrajectoiresSpreadsheetService.name);
  private readonly TRAJECTOIRE_GROUPEMENT = 'trajectoire';

  constructor(
    private readonly indicateurSourcesService: IndicateurSourcesService,
    private readonly indicateursService: IndicateursService,
    private readonly trajectoiresDataService: TrajectoiresDataService,
    private readonly sheetService: SheetService,
    private readonly groupementsService: GroupementsService,
  ) {}

  getIdentifiantSpreadsheetCalcul() {
    return process.env.TRAJECTOIRE_SNBC_SHEET_ID!;
  }

  getIdentifiantDossierResultat() {
    return process.env.TRAJECTOIRE_SNBC_RESULT_FOLDER_ID!;
  }

  getNomFichierTrajectoire(epci: EpciType) {
    return `Trajectoire SNBC - ${epci.siren} - ${epci.nom}`;
  }

  async calculeTrajectoireSnbc(
    request: CalculTrajectoireRequestType,
    tokenInfo: SupabaseJwtPayload,
    epci?: EpciType,
  ): Promise<CalculTrajectoireResultType> {
    let mode: CalculTrajectoireResultatMode =
      CalculTrajectoireResultatMode.NOUVEAU_SPREADSHEET;

    if (!this.getIdentifiantSpreadsheetCalcul()) {
      throw new InternalServerErrorException(
        "L'identifiant de la feuille de calcul pour les trajectoires SNBC est manquante",
      );
    }

    if (!this.getIdentifiantDossierResultat()) {
      throw new InternalServerErrorException(
        "L'identifiant du dossier pour le stockage des trajectoires SNBC calculées est manquant",
      );
    }

    // Création de la source métadonnée SNBC si elle n'existe pas
    let indicateurSourceMetadonnee =
      await this.indicateurSourcesService.getIndicateurSourceMetadonnee(
        this.trajectoiresDataService.SNBC_SOURCE.id,
        this.trajectoiresDataService.SNBC_SOURCE_METADONNEES.date_version,
      );
    if (!indicateurSourceMetadonnee) {
      this.logger.log(
        `Création de la metadonnée pour la source ${this.trajectoiresDataService.SNBC_SOURCE.id} et la date ${this.trajectoiresDataService.SNBC_SOURCE_METADONNEES.date_version.toISOString()}`,
      );
      await this.indicateurSourcesService.upsertIndicateurSource(
        this.trajectoiresDataService.SNBC_SOURCE,
      );

      indicateurSourceMetadonnee =
        await this.indicateurSourcesService.createIndicateurSourceMetadonnee(
          this.trajectoiresDataService.SNBC_SOURCE_METADONNEES,
        );
    }
    this.logger.log(
      `La metadonnée pour la source ${this.trajectoiresDataService.SNBC_SOURCE.id} et la date ${this.trajectoiresDataService.SNBC_SOURCE_METADONNEES.date_version.toISOString()} existe avec l'identifiant ${indicateurSourceMetadonnee.id}`,
    );

    // Récupération du groupement auquel la collectivité devra être rattachée
    const groupement = await this.groupementsService.getGroupementAvecNom(
      this.TRAJECTOIRE_GROUPEMENT,
    );
    this.logger.log(
      `Groupement pour la trajectoire trouvé avec l'id ${groupement.id}`,
    );

    const resultatVerification =
      await this.trajectoiresDataService.verificationDonneesSnbc(
        request,
        tokenInfo,
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
        `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : ${identifiantsReferentielManquants.join(', ')}, impossible de calculer la trajectoire SNBC.`,
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
        const indicateurDefinitions =
          await this.indicateursService.getReferentielIndicateurDefinitions(
            this.trajectoiresDataService
              .SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL,
          );
        const [
          indicateurConsommationDefinitions,
          indicateurEmissionsSequestrationDefinitions,
        ] = partition(
          indicateurDefinitions,
          (definition) =>
            definition.identifiant_referentiel?.startsWith(
              this.trajectoiresDataService.CONSOMMATIONS_IDENTIFIANTS_PREFIX,
            ) || false,
        );

        const [
          indicateurSequestrationDefinitions,
          indicateurEmissionsDefinitions,
        ] = partition(
          indicateurEmissionsSequestrationDefinitions,
          (definition) =>
            definition.identifiant_referentiel?.startsWith(
              this.trajectoiresDataService.SEQUESTRATION_IDENTIFIANTS_PREFIX,
            ) || false,
        );

        const emissionGesTrajectoire =
          this.indicateursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurEmissionsDefinitions,
            true,
          );

        const consommationsTrajectoire =
          this.indicateursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurConsommationDefinitions,
            true,
          );

        const sequestrationTrajectoire =
          this.indicateursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurSequestrationDefinitions,
            true,
          );

        mode = CalculTrajectoireResultatMode.DONNEES_EN_BDD;
        const result: CalculTrajectoireResultType = {
          mode: mode,
          source_donnees_entree:
            resultatVerification.source_donnees_entree || '',
          indentifiants_referentiel_manquants_donnees_entree:
            resultatVerification.indentifiants_referentiel_manquants_donnees_entree ||
            [],
          spreadsheet_id: trajectoireCalculSheetId,
          trajectoire: {
            emissions_ges: emissionGesTrajectoire,
            consommations_finales: consommationsTrajectoire,
            sequestrations: sequestrationTrajectoire,
          },
        };

        return result;
      }
    } else if (
      resultatVerification.status === VerificationDonneesSNBCStatus.DEJA_CALCULE
    ) {
      this.logger.log(
        `Résultats de la trajectoire SNBC déjà calculés, recalcul des données (request mode: ${request.mode}) après suppression des données existantes`,
      );
      // Suppression des données existantes
      await this.trajectoiresDataService.deleteTrajectoireSnbc(
        request.collectivite_id,
        indicateurSourceMetadonnee.id,
      );
    }
    epci = resultatVerification.epci;

    const nomFichier = this.getNomFichierTrajectoire(epci);
    let trajectoireCalculSheetId = await this.sheetService.getFileIdByName(
      nomFichier,
      this.getIdentifiantDossierResultat(),
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
        this.getIdentifiantSpreadsheetCalcul(),
        nomFichier,
        [this.getIdentifiantDossierResultat()],
      );
      this.logger.log(
        `Fichier de trajectoire SNBC créé à partir du master ${this.getIdentifiantSpreadsheetCalcul()} avec l'identifiant ${trajectoireCalculSheetId}`,
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
      this.trajectoiresDataService.SNBC_SIREN_CELLULE,
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
      this.trajectoiresDataService.SNBC_EMISSIONS_GES_CELLULES,
      emissionGesSpreadsheetData,
    );

    // Ecriture des informations de sequestration
    // les valeurs à remplir doivent être en ktCO2 et les données dans la plateforme sont en tCO2
    const sequestrationSpreadsheetData =
      resultatVerification.donnees_entree.sequestrations.valeurs.map(
        (valeur) => [(valeur.valeur || 0) / 1000],
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.trajectoiresDataService.SNBC_SEQUESTRATION_CELLULES,
      sequestrationSpreadsheetData,
    );

    // Ecriture des informations de consommation finales
    const consommationSpreadsheetData =
      resultatVerification.donnees_entree.consommations_finales.valeurs.map(
        (valeur) => [valeur.valeur || 0],
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.trajectoiresDataService.SNBC_CONSOMMATIONS_CELLULES,
      consommationSpreadsheetData,
    );

    const indicateurResultatDefinitions =
      await this.indicateursService.getReferentielIndicateurDefinitions(
        this.trajectoiresDataService.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL.filter(
          (identifiant) => identifiant !== '',
        ),
      );

    const trajectoireCalculResultat =
      await this.sheetService.getRawDataFromSheet(
        trajectoireCalculSheetId,
        this.trajectoiresDataService.SNBC_TRAJECTOIRE_RESULTAT_CELLULES,
      );

    const indicateurValeursTrajectoireResultat =
      this.getIndicateurValeursACreer(
        request.collectivite_id,
        indicateurSourceMetadonnee.id,
        trajectoireCalculResultat.data,
        this.trajectoiresDataService
          .SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL,
        indicateurResultatDefinitions,
        resultatVerification.donnees_entree,
      );

    this.logger.log(
      `Ecriture des ${indicateurValeursTrajectoireResultat.length} valeurs des indicateurs correspondant à la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    const upsertedTrajectoireIndicateurValeurs =
      await this.indicateursService.upsertIndicateurValeurs(
        indicateurValeursTrajectoireResultat,
      );

    // Maintenant que les indicateurs ont été créés, on peut ajouter la collectivité au groupement
    await this.groupementsService.ajouteCollectiviteAuGroupement(
      groupement.id,
      request.collectivite_id,
    );

    const [
      indicateurResultatConsommationDefinitions,
      indicateurResultatSequestrationEmissionsDefinitions,
    ] = partition(
      indicateurResultatDefinitions,
      (definition) =>
        definition.identifiant_referentiel?.startsWith(
          this.trajectoiresDataService.CONSOMMATIONS_IDENTIFIANTS_PREFIX,
        ) || false,
    );

    const [
      indicateurResultatSequestrationDefinitions,
      indicateurResultatEmissionsDefinitions,
    ] = partition(
      indicateurResultatSequestrationEmissionsDefinitions,
      (definition) =>
        definition.identifiant_referentiel?.startsWith(
          this.trajectoiresDataService.SEQUESTRATION_IDENTIFIANTS_PREFIX,
        ) || false,
    );

    const emissionGesTrajectoire =
      this.indicateursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatEmissionsDefinitions,
        true,
      );

    const consommationsTrajectoire =
      this.indicateursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatConsommationDefinitions,
        true,
      );

    const sequestrationTrajectoire =
      this.indicateursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatSequestrationDefinitions,
        true,
      );

    const result: CalculTrajectoireResultType = {
      mode: mode,
      source_donnees_entree: resultatVerification.donnees_entree.source,
      indentifiants_referentiel_manquants_donnees_entree: [
        ...resultatVerification.donnees_entree.emissions_ges
          .identifiants_referentiel_manquants,
        ...resultatVerification.donnees_entree.sequestrations
          .identifiants_referentiel_manquants,
        ...resultatVerification.donnees_entree.consommations_finales
          .identifiants_referentiel_manquants,
      ],
      spreadsheet_id: trajectoireCalculSheetId,
      trajectoire: {
        emissions_ges: emissionGesTrajectoire,
        consommations_finales: consommationsTrajectoire,
        sequestrations: sequestrationTrajectoire,
      },
    };
    return result;
  }

  getIdentifiantReferentielParent(
    identifiantReferentiel: string,
  ): string | null {
    const identifiantReferentielSortieParts = identifiantReferentiel.split('.');
    if (identifiantReferentielSortieParts.length <= 1) {
      return null;
    }
    if (identifiantReferentielSortieParts[1].length > 1) {
      return `${identifiantReferentielSortieParts[0]}.${identifiantReferentielSortieParts[1].slice(0, -1)}`;
    } else {
      return null;
    }
  }

  getIndicateurValeursACreer(
    collectiviteId: number,
    indicateurSourceMetadonneeId: number,
    donneesSpreadsheet: any[][] | null,
    identifiantsReferentielAssocie: string[],
    indicateurResultatDefinitions: IndicateurDefinitionType[],
    donneesCalculTrajectoire: DonneesCalculTrajectoireARemplirType,
  ): CreateIndicateurValeurType[] {
    const donneesEntree = [
      ...donneesCalculTrajectoire.emissions_ges.valeurs,
      ...donneesCalculTrajectoire.consommations_finales.valeurs,
      ...donneesCalculTrajectoire.sequestrations.valeurs,
    ];
    const objectifCommentaire =
      this.trajectoiresDataService.getObjectifCommentaire(
        donneesCalculTrajectoire,
      );

    const indicateurValeursResultat: CreateIndicateurValeurType[] = [];
    donneesSpreadsheet?.forEach((ligne, ligneIndex) => {
      const identifiantReferentielSortie =
        identifiantsReferentielAssocie[ligneIndex];
      if (identifiantReferentielSortie) {
        let identifiantsReferentielEntree = [
          this.getIdentifiantReferentielParent(identifiantReferentielSortie) ||
            identifiantReferentielSortie,
        ];
        // Exception pour les transports: dépend de deux indicateurs Transport routier et Autres transports
        if (identifiantReferentielSortie === 'cae_1.k') {
          identifiantsReferentielEntree = ['cae_1.e', 'cae_1.f'];
        }
        // TODO: exception pour les totaux?
        const valeursEntreeManquantes = identifiantsReferentielEntree.filter(
          (identifiant) => {
            const donneeEntree = donneesEntree.find((v) =>
              v.identifiants_referentiel.includes(identifiant),
            );
            if (!donneeEntree) {
              return true;
            }
            return isNil(donneeEntree.valeur);
          },
        );

        if (valeursEntreeManquantes?.length) {
          this.logger.log(
            `Indicateur ${valeursEntreeManquantes.join(',')} manquant en entrée, résultats pour indicateur ${identifiantReferentielSortie} ignorés`,
          );
        } else {
          const indicateurResultatDefinition =
            indicateurResultatDefinitions.find(
              (definition) =>
                definition.identifiant_referentiel ===
                identifiantReferentielSortie,
            );
          if (indicateurResultatDefinition) {
            ligne.forEach((valeur, columnIndex) => {
              const floatValeur = parseFloat(valeur);
              if (!isNaN(floatValeur)) {
                const emissionGes =
                  !indicateurResultatDefinition.identifiant_referentiel?.startsWith(
                    this.trajectoiresDataService
                      .CONSOMMATIONS_IDENTIFIANTS_PREFIX,
                  );
                // les valeurs lues sont en ktCO2 et les données dans la plateforme sont en tCO2
                const facteur = emissionGes ? 1000 : 1;
                const indicateurValeur: CreateIndicateurValeurType = {
                  indicateur_id: indicateurResultatDefinition.id,
                  collectivite_id: collectiviteId,
                  metadonnee_id: indicateurSourceMetadonneeId,
                  date_valeur: `${2015 + columnIndex}-01-01`,
                  objectif: floatValeur * facteur,
                  objectif_commentaire: objectifCommentaire,
                };
                indicateurValeursResultat.push(indicateurValeur);
              } else {
                this.logger.warn(
                  `Valeur non numérique ${valeur} pour la ligne ${ligneIndex} et la colonne ${columnIndex} de la plage ${this.trajectoiresDataService.SNBC_TRAJECTOIRE_RESULTAT_CELLULES}`,
                );
              }
            });
          } else {
            this.logger.warn(
              `Indicateur ${identifiantReferentielSortie} non trouvé, résultats ignorés`,
            );
          }
        }
      }
    });
    return indicateurValeursResultat;
  }
}
