import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { isNil, partition } from 'es-toolkit';
import * as _ from 'lodash';
import slugify from 'slugify';
import { SupabaseJwtPayload } from '../../auth/models/supabase-jwt.models';
import { EpciType } from '../../collectivites/models/epci.table';
import GroupementsService from '../../collectivites/services/groupements.service';
import { BackendConfigurationType } from '../../config/configuration.model';
import ConfigurationService from '../../config/configuration.service';
import SheetService from '../../spreadsheets/services/sheet.service';
import {
  CalculTrajectoireRequestType,
  CalculTrajectoireReset,
  CalculTrajectoireResultType,
  CalculTrajectoireResultatMode,
  DonneesCalculTrajectoireARemplirType,
  VerificationDonneesSNBCStatus,
} from '../models/calcultrajectoire.models';
import { CreateIndicateurValeurType } from '../models/indicateur-valeur.table';
import { IndicateurDefinitionType } from '../models/indicateur-definition.table';
import IndicateursService from './indicateurs.service';
import IndicateurSourcesService from './indicateurSources.service';
import TrajectoiresDataService from './trajectoires-data.service';

@Injectable()
export default class TrajectoiresSpreadsheetService {
  private readonly logger = new Logger(TrajectoiresSpreadsheetService.name);
  private readonly TRAJECTOIRE_GROUPEMENT = 'trajectoire';

  constructor(
    private readonly configService: ConfigurationService,
    private readonly indicateurSourcesService: IndicateurSourcesService,
    private readonly indicateursService: IndicateursService,
    private readonly trajectoiresDataService: TrajectoiresDataService,
    private readonly sheetService: SheetService,
    private readonly groupementsService: GroupementsService
  ) {}

  getIdentifiantSpreadsheetCalcul() {
    return this.configService.get('TRAJECTOIRE_SNBC_SHEET_ID');
  }

  getIdentifiantDossierResultat() {
    return this.configService.get('TRAJECTOIRE_SNBC_RESULT_FOLDER_ID');
  }

  getNomFichierTrajectoire(epci: EpciType) {
    return slugify(`Trajectoire SNBC - ${epci.siren} - ${epci.nom}`, {
      replacement: ' ',
      remove: /[*+~.()'"!:@]/g,
    });
  }

  async calculeTrajectoireSnbc(
    request: CalculTrajectoireRequestType,
    tokenInfo: SupabaseJwtPayload,
    epci?: EpciType
  ): Promise<CalculTrajectoireResultType> {
    let mode: CalculTrajectoireResultatMode =
      CalculTrajectoireResultatMode.NOUVEAU_SPREADSHEET;

    if (!this.getIdentifiantSpreadsheetCalcul()) {
      throw new InternalServerErrorException(
        "L'identifiant de la feuille de calcul pour les trajectoires SNBC est manquante"
      );
    }

    if (!this.getIdentifiantDossierResultat()) {
      throw new InternalServerErrorException(
        "L'identifiant du dossier pour le stockage des trajectoires SNBC calculées est manquant"
      );
    }

    const indicateurSourceMetadonnee =
      await this.trajectoiresDataService.getTrajectoireIndicateursMetadonnees();

    // Récupération du groupement auquel la collectivité devra être rattachée
    const groupement = await this.groupementsService.getGroupementAvecNom(
      this.TRAJECTOIRE_GROUPEMENT
    );
    this.logger.log(
      `Groupement pour la trajectoire trouvé avec l'id ${groupement.id}`
    );

    const resultatVerification =
      await this.trajectoiresDataService.verificationDonneesSnbc(
        request,
        tokenInfo,
        epci,
        Boolean(request.mode)
      );

    if (
      resultatVerification.status ===
        VerificationDonneesSNBCStatus.COMMUNE_NON_SUPPORTEE ||
      !resultatVerification.epci
    ) {
      throw new UnprocessableEntityException(
        `Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI.`
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
        `Résultats de la trajectoire SNBC déjà calculés, lecture des données en base (request mode: ${request.mode})`
      );
      const trajectoireCalculSheetId = await this.sheetService.getFileIdByName(
        this.getNomFichierTrajectoire(resultatVerification.epci),
        this.getIdentifiantDossierResultat()
      );
      if (trajectoireCalculSheetId) {
        const indicateurDefinitions =
          await this.indicateursService.getReferentielIndicateurDefinitions(
            this.trajectoiresDataService
              .SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL
          );
        const [
          indicateurConsommationDefinitions,
          indicateurEmissionsSequestrationDefinitions,
        ] = partition(
          indicateurDefinitions,
          (definition) =>
            definition.identifiantReferentiel?.startsWith(
              this.trajectoiresDataService.CONSOMMATIONS_IDENTIFIANTS_PREFIX
            ) || false
        );

        const [
          indicateurSequestrationDefinitions,
          indicateurEmissionsDefinitions,
        ] = partition(
          indicateurEmissionsSequestrationDefinitions,
          (definition) =>
            definition.identifiantReferentiel?.startsWith(
              this.trajectoiresDataService.SEQUESTRATION_IDENTIFIANTS_PREFIX
            ) || false
        );

        const emissionGesTrajectoire =
          this.indicateursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurEmissionsDefinitions,
            true
          );

        const consommationsTrajectoire =
          this.indicateursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurConsommationDefinitions,
            true
          );

        const sequestrationTrajectoire =
          this.indicateursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurSequestrationDefinitions,
            true
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
        this.inverseSigneSequestrations(result);

        return result;
      }
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
        `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : ${identifiantsReferentielManquants.join(
          ', '
        )}, impossible de calculer la trajectoire SNBC.`
      );
    } else if (
      resultatVerification.status === VerificationDonneesSNBCStatus.DEJA_CALCULE
    ) {
      this.logger.log(
        `Résultats de la trajectoire SNBC déjà calculés, recalcul des données (request mode: ${request.mode}) après suppression des données existantes`
      );
      // Suppression des données existantes
      await this.trajectoiresDataService.deleteTrajectoireSnbc(
        request.collectivite_id,
        indicateurSourceMetadonnee.id
      );
    }
    epci = resultatVerification.epci;

    const nomFichier = this.getNomFichierTrajectoire(epci);
    let trajectoireCalculSheetId = await this.sheetService.getFileIdByName(
      nomFichier,
      this.getIdentifiantDossierResultat()
    );
    if (
      trajectoireCalculSheetId &&
      request.mode !== CalculTrajectoireReset.NOUVEAU_SPREADSHEET
    ) {
      mode = CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT;
      this.logger.log(
        `Fichier de trajectoire SNBC trouvé avec l'identifiant ${trajectoireCalculSheetId}`
      );
    } else {
      if (trajectoireCalculSheetId) {
        this.logger.log(
          `Suppression du fichier de trajectoire SNBC existant ayant l'identifiant ${trajectoireCalculSheetId}`
        );
        await this.sheetService.deleteFile(trajectoireCalculSheetId);
      }
      trajectoireCalculSheetId = await this.sheetService.copyFile(
        this.getIdentifiantSpreadsheetCalcul(),
        nomFichier,
        [this.getIdentifiantDossierResultat()]
      );
      this.logger.log(
        `Fichier de trajectoire SNBC créé à partir du master ${this.getIdentifiantSpreadsheetCalcul()} avec l'identifiant ${trajectoireCalculSheetId}`
      );
    }

    // Ecriture du SIREN
    const sirenNumber = parseInt(epci.siren || '');
    if (isNaN(sirenNumber)) {
      throw new InternalServerErrorException(
        `Le SIREN de l'EPCI ${epci.nom} (${epci.siren}) n'est pas un nombre`
      );
    }

    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.trajectoiresDataService.SNBC_SIREN_CELLULE,
      [[sirenNumber]]
    );

    // Ecriture des informations d'émission GES
    // les valeurs à remplir doivent être en ktCO2 et les données dans la plateforme sont en tCO2
    const emissionGesSpreadsheetData =
      resultatVerification.donnees_entree!.emissions_ges.valeurs.map(
        (valeur) => [(valeur.valeur || 0) / 1000]
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.trajectoiresDataService.SNBC_EMISSIONS_GES_CELLULES,
      emissionGesSpreadsheetData
    );

    // Ecriture des informations de sequestration
    // les valeurs à remplir doivent être en ktCO2 et les données dans la plateforme sont en tCO2
    // Les valeurs de séquestration sont positives en base quand il y a une séquestration mais doivent être écrites avec le signe opposé
    const sequestrationSpreadsheetData =
      resultatVerification.donnees_entree!.sequestrations.valeurs.map(
        (valeur) => [((valeur.valeur || 0) * -1) / 1000]
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.trajectoiresDataService.SNBC_SEQUESTRATION_CELLULES,
      sequestrationSpreadsheetData
    );

    // Ecriture des informations de consommation finales
    const consommationSpreadsheetData =
      resultatVerification.donnees_entree!.consommations_finales.valeurs.map(
        (valeur) => [valeur.valeur || 0]
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.trajectoiresDataService.SNBC_CONSOMMATIONS_CELLULES,
      consommationSpreadsheetData
    );

    const indicateurResultatDefinitions =
      await this.indicateursService.getReferentielIndicateurDefinitions(
        this.trajectoiresDataService.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL.filter(
          (identifiant) => identifiant !== ''
        )
      );

    const trajectoireCalculResultat =
      await this.sheetService.getRawDataFromSheet(
        trajectoireCalculSheetId,
        this.trajectoiresDataService.SNBC_TRAJECTOIRE_RESULTAT_CELLULES
      );

    const indicateurValeursTrajectoireResultat =
      this.getIndicateurValeursACreer(
        request.collectivite_id,
        indicateurSourceMetadonnee.id,
        trajectoireCalculResultat.data,
        this.trajectoiresDataService
          .SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL,
        indicateurResultatDefinitions,
        resultatVerification.donnees_entree!
      );

    this.logger.log(
      `Ecriture des ${indicateurValeursTrajectoireResultat.length} valeurs des indicateurs correspondant à la trajectoire SNBC pour la collectivité ${request.collectivite_id}`
    );
    const upsertedTrajectoireIndicateurValeurs =
      await this.indicateursService.upsertIndicateurValeurs(
        indicateurValeursTrajectoireResultat
      );

    // Maintenant que les indicateurs ont été créés, on peut ajouter la collectivité au groupement
    await this.groupementsService.ajouteCollectiviteAuGroupement(
      groupement.id,
      request.collectivite_id
    );

    const [
      indicateurResultatConsommationDefinitions,
      indicateurResultatSequestrationEmissionsDefinitions,
    ] = partition(
      indicateurResultatDefinitions,
      (definition) =>
        definition.identifiantReferentiel?.startsWith(
          this.trajectoiresDataService.CONSOMMATIONS_IDENTIFIANTS_PREFIX
        ) || false
    );

    const [
      indicateurResultatSequestrationDefinitions,
      indicateurResultatEmissionsDefinitions,
    ] = partition(
      indicateurResultatSequestrationEmissionsDefinitions,
      (definition) =>
        definition.identifiantReferentiel?.startsWith(
          this.trajectoiresDataService.SEQUESTRATION_IDENTIFIANTS_PREFIX
        ) || false
    );

    const emissionGesTrajectoire =
      this.indicateursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatEmissionsDefinitions,
        true
      );

    const consommationsTrajectoire =
      this.indicateursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatConsommationDefinitions,
        true
      );

    const sequestrationTrajectoire =
      this.indicateursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatSequestrationDefinitions,
        true
      );

    const result: CalculTrajectoireResultType = {
      mode: mode,
      source_donnees_entree: resultatVerification.donnees_entree!.source,
      indentifiants_referentiel_manquants_donnees_entree: [
        ...resultatVerification.donnees_entree!.emissions_ges
          .identifiants_referentiel_manquants,
        ...resultatVerification.donnees_entree!.sequestrations
          .identifiants_referentiel_manquants,
        ...resultatVerification.donnees_entree!.consommations_finales
          .identifiants_referentiel_manquants,
      ],
      spreadsheet_id: trajectoireCalculSheetId,
      trajectoire: {
        emissions_ges: emissionGesTrajectoire,
        consommations_finales: consommationsTrajectoire,
        sequestrations: sequestrationTrajectoire,
      },
    };

    this.inverseSigneSequestrations(result);
    return result;
  }

  inverseSigneSequestrations(result: CalculTrajectoireResultType) {
    // Il y a le cae_1.csc qui est une exception
    result.trajectoire.emissions_ges.forEach((emissionGes) => {
      if (
        this.signeInversionSequestration(
          emissionGes.definition.identifiantReferentiel
        )
      ) {
        emissionGes.valeurs.forEach((valeur) => {
          if (valeur.objectif) {
            valeur.objectif = -1 * valeur.objectif;
          }
          if (valeur.resultat) {
            // Normalement pas nécessaire car uniquement résultat
            valeur.resultat = -1 * valeur.resultat;
          }
        });
      }
    });
    // Normalement, fait pour tous les indicateurs de séquestration mais on réutilise signeInversionSequestration au cas où la logique change
    result.trajectoire.sequestrations.forEach((sequestration) => {
      if (
        this.signeInversionSequestration(
          sequestration.definition.identifiantReferentiel
        )
      ) {
        sequestration.valeurs.forEach((valeur) => {
          if (valeur.objectif) {
            valeur.objectif = -1 * valeur.objectif;
          }
          if (valeur.resultat) {
            // Normalement pas nécessaire car uniquement résultat
            valeur.resultat = -1 * valeur.resultat;
          }
        });
      }
    });
  }

  getIdentifiantReferentielParent(
    identifiantReferentiel: string
  ): string | null {
    const identifiantReferentielSortieParts = identifiantReferentiel.split('.');
    if (identifiantReferentielSortieParts.length <= 1) {
      return null;
    }
    if (identifiantReferentielSortieParts[1].length > 1) {
      const partieApresPoint = identifiantReferentielSortieParts[1];
      const partieApresPointParts = partieApresPoint.split('_');
      if (partieApresPointParts[0].length > 1) {
        return `${
          identifiantReferentielSortieParts[0]
        }.${partieApresPointParts[0].slice(0, -1)}`;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  signeInversionSequestration(identifiantReferentiel?: string | null): boolean {
    return (
      identifiantReferentiel?.startsWith(
        this.trajectoiresDataService.SEQUESTRATION_IDENTIFIANTS_PREFIX
      ) || identifiantReferentiel === 'cae_1.csc'
    );
  }

  getIndicateurValeursACreer(
    collectiviteId: number,
    indicateurSourceMetadonneeId: number,
    donneesSpreadsheet: any[][] | null,
    identifiantsReferentielAssocie: string[],
    indicateurResultatDefinitions: IndicateurDefinitionType[],
    donneesCalculTrajectoire: DonneesCalculTrajectoireARemplirType
  ): CreateIndicateurValeurType[] {
    const donneesEntree = [
      ...donneesCalculTrajectoire.emissions_ges.valeurs,
      ...donneesCalculTrajectoire.consommations_finales.valeurs,
      ...donneesCalculTrajectoire.sequestrations.valeurs,
    ];
    const objectifCommentaire =
      this.trajectoiresDataService.getObjectifCommentaire(
        donneesCalculTrajectoire
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
          // Exception pour les transports: dépend de deux indicateurs Transport routier et Autres transports
        } else if (identifiantReferentielSortie === 'cae_2.m') {
          identifiantsReferentielEntree = ['cae_2.g', 'cae_2.h'];
          // Exception, pour cae_1.csc, pas de données d'entrée associée
        } else if (identifiantReferentielSortie === 'cae_1.csc') {
          identifiantsReferentielEntree = [];
          // Exception pour les totaux
        } else if (identifiantReferentielSortie === 'cae_63.a') {
          identifiantsReferentielEntree = _.flatten(
            this.trajectoiresDataService
              .SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL
          );
        } else if (identifiantReferentielSortie === 'cae_2.a') {
          identifiantsReferentielEntree = _.flatten(
            this.trajectoiresDataService
              .SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL
          );
        } else if (identifiantReferentielSortie === 'cae_1.a') {
          identifiantsReferentielEntree = _.flatten(
            this.trajectoiresDataService
              .SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL
          );
        } else if (identifiantReferentielSortie === 'cae_1.aa') {
          identifiantsReferentielEntree = [
            ..._.flatten(
              this.trajectoiresDataService
                .SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL
            ),
            ..._.flatten(
              this.trajectoiresDataService
                .SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL
            ),
          ];
          // Exception pour les sequestrations, on ne prend pas le parent
        } else if (
          identifiantReferentielSortie.startsWith(
            this.trajectoiresDataService.SEQUESTRATION_IDENTIFIANTS_PREFIX
          )
        ) {
          identifiantsReferentielEntree = [identifiantReferentielSortie];
        }
        this.logger.log(
          `Identifiant referentiel entrée pour ${identifiantReferentielSortie}: ${identifiantsReferentielEntree.join(
            ', '
          )}`
        );

        const valeursEntreeManquantes = identifiantsReferentielEntree.filter(
          (identifiant) => {
            const donneeEntree = donneesEntree.find((v) =>
              v.identifiants_referentiel.includes(identifiant)
            );
            if (!donneeEntree) {
              return true;
            }
            return isNil(donneeEntree.valeur);
          }
        );

        if (valeursEntreeManquantes?.length) {
          this.logger.log(
            `Indicateur ${valeursEntreeManquantes.join(
              ','
            )} manquant en entrée, résultats pour indicateur ${identifiantReferentielSortie} ignorés`
          );
        } else {
          const indicateurResultatDefinition =
            indicateurResultatDefinitions.find(
              (definition) =>
                definition.identifiantReferentiel ===
                identifiantReferentielSortie
            );
          if (indicateurResultatDefinition) {
            ligne.forEach((valeur, columnIndex) => {
              const floatValeur = parseFloat(valeur);
              if (!isNaN(floatValeur)) {
                const emissionGesOuSequestration =
                  !indicateurResultatDefinition.identifiantReferentiel?.startsWith(
                    this.trajectoiresDataService
                      .CONSOMMATIONS_IDENTIFIANTS_PREFIX
                  );

                // les valeurs lues sont en ktCO2 et les données dans la plateforme sont en tCO2
                let facteur = emissionGesOuSequestration ? 1000 : 1;
                const signeInversionSequestration =
                  this.signeInversionSequestration(
                    indicateurResultatDefinition.identifiantReferentiel
                  );
                if (signeInversionSequestration) {
                  // Les valeurs de séquestration sont positives en base quand il y a une séquestration mais la convention inverse est dans l'excel
                  facteur = -1 * facteur;
                }
                const indicateurValeur: CreateIndicateurValeurType = {
                  indicateurId: indicateurResultatDefinition.id,
                  collectiviteId: collectiviteId,
                  metadonneeId: indicateurSourceMetadonneeId,
                  dateValeur: `${2015 + columnIndex}-01-01`,
                  objectif: floatValeur * facteur,
                  objectifCommentaire: objectifCommentaire,
                };
                indicateurValeursResultat.push(indicateurValeur);
              } else {
                this.logger.warn(
                  `Valeur non numérique ${valeur} pour la ligne ${ligneIndex} et la colonne ${columnIndex} de la plage ${this.trajectoiresDataService.SNBC_TRAJECTOIRE_RESULTAT_CELLULES}`
                );
              }
            });
          } else {
            this.logger.warn(
              `Indicateur ${identifiantReferentielSortie} non trouvé, résultats ignorés`
            );
          }
        }
      }
    });
    return indicateurValeursResultat;
  }
}
