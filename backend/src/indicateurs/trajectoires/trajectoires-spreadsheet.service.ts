import { CollectiviteResume } from '@/backend/collectivites/shared/models/collectivite.table';
import {
    Injectable,
    InternalServerErrorException,
    Logger,
    UnprocessableEntityException,
} from '@nestjs/common';
import { isNil, partition } from 'es-toolkit';
import * as _ from 'lodash';
import slugify from 'slugify';
import GroupementsService from '../../collectivites/services/groupements.service';
import { AuthUser } from '../../users/models/auth.models';
import ConfigurationService from '../../utils/config/configuration.service';
import SheetService from '../../utils/google-sheets/sheet.service';
import { ListDefinitionsService } from '../list-definitions/list-definitions.service';
import { IndicateurDefinition } from '../shared/models/indicateur-definition.table';
import { IndicateurValeurInsert } from '../shared/models/indicateur-valeur.table';
import IndicateurSourcesService from '../sources/indicateur-sources.service';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import {
    CalculTrajectoireRequestType,
    CalculTrajectoireReset,
    CalculTrajectoireResultatMode,
} from './calcul-trajectoire.request';
import { CalculTrajectoireResult } from './calcul-trajectoire.response';
import { DonneesCalculTrajectoireARemplirType } from './donnees-calcul-trajectoire-a-remplir.dto';
import TrajectoiresDataService from './trajectoires-data.service';
import { VerificationTrajectoireStatus } from './verification-trajectoire.response';

@Injectable()
export default class TrajectoiresSpreadsheetService {
  private readonly logger = new Logger(TrajectoiresSpreadsheetService.name);
  private readonly TRAJECTOIRE_GROUPEMENT = 'trajectoire';

  constructor(
    private readonly configService: ConfigurationService,
    private readonly indicateurSourcesService: IndicateurSourcesService,
    private readonly indicateursService: ListDefinitionsService,
    private readonly valeursService: CrudValeursService,
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

  getNomFichierTrajectoire(epci: CollectiviteResume) {
    return slugify(`Trajectoire SNBC - ${epci.siren} - ${epci.nom}`, {
      replacement: ' ',
      remove: /[*+~.()'"!:@]/g,
    });
  }

  async calculeTrajectoireSnbc(
    request: CalculTrajectoireRequestType,
    tokenInfo: AuthUser,
    epci?: CollectiviteResume
  ): Promise<CalculTrajectoireResult> {
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
        VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE ||
      !resultatVerification.epci
    ) {
      throw new UnprocessableEntityException(
        `Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI.`
      );
    } else if (
      resultatVerification.status ===
        VerificationTrajectoireStatus.DEJA_CALCULE &&
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
          this.valeursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurEmissionsDefinitions,
            true
          );

        const consommationsTrajectoire =
          this.valeursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurConsommationDefinitions,
            true
          );

        const sequestrationTrajectoire =
          this.valeursService.groupeIndicateursValeursParIndicateur(
            resultatVerification.valeurs,
            indicateurSequestrationDefinitions,
            true
          );

        mode = CalculTrajectoireResultatMode.DONNEES_EN_BDD;
        const result: CalculTrajectoireResult = {
          mode: mode,
          sourcesDonneesEntree: resultatVerification.sourcesDonneesEntree || [],
          indentifiantsReferentielManquantsDonneesEntree:
            resultatVerification.indentifiantsReferentielManquantsDonneesEntree ||
            [],
          spreadsheetId: trajectoireCalculSheetId,
          trajectoire: {
            emissionsGes: emissionGesTrajectoire,
            consommationsFinales: consommationsTrajectoire,
            sequestrations: sequestrationTrajectoire,
          },
        };
        this.inverseSigneSequestrations(result);

        return result;
      }
    } else if (
      resultatVerification.status ===
        VerificationTrajectoireStatus.DONNEES_MANQUANTES ||
      !resultatVerification.donneesEntree
    ) {
      const identifiantsReferentielManquants = [
        ...(resultatVerification.donneesEntree?.emissionsGes
          .identifiantsReferentielManquants || []),
        ...(resultatVerification.donneesEntree?.consommationsFinales
          .identifiantsReferentielManquants || []),
      ];
      throw new UnprocessableEntityException(
        `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : ${identifiantsReferentielManquants.join(
          ', '
        )}, impossible de calculer la trajectoire SNBC.`
      );
    } else if (
      resultatVerification.status === VerificationTrajectoireStatus.DEJA_CALCULE
    ) {
      this.logger.log(
        `Résultats de la trajectoire SNBC déjà calculés, recalcul des données (request mode: ${request.mode}) après suppression des données existantes`
      );
      // Suppression des données existantes
      await this.trajectoiresDataService.deleteTrajectoireSnbc(
        request.collectiviteId,
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
    const emissionGesSpreadsheetData =
      resultatVerification.donneesEntree!.emissionsGes.valeurs.map((valeur) => [
        valeur.valeur || 0,
      ]);
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.trajectoiresDataService.SNBC_EMISSIONS_GES_CELLULES,
      emissionGesSpreadsheetData
    );

    // Ecriture des informations de sequestration
    // Les valeurs de séquestration sont positives en base quand il y a une séquestration mais doivent être écrites avec le signe opposé
    const sequestrationSpreadsheetData =
      resultatVerification.donneesEntree!.sequestrations.valeurs.map(
        (valeur) => [(valeur.valeur || 0) * -1]
      );
    await this.sheetService.overwriteRawDataToSheet(
      trajectoireCalculSheetId,
      this.trajectoiresDataService.SNBC_SEQUESTRATION_CELLULES,
      sequestrationSpreadsheetData
    );

    // Ecriture des informations de consommation finales
    const consommationSpreadsheetData =
      resultatVerification.donneesEntree!.consommationsFinales.valeurs.map(
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
        request.collectiviteId,
        indicateurSourceMetadonnee.id,
        trajectoireCalculResultat.data,
        this.trajectoiresDataService
          .SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL,
        indicateurResultatDefinitions,
        resultatVerification.donneesEntree!
      );

    this.logger.log(
      `Ecriture des ${indicateurValeursTrajectoireResultat.length} valeurs des indicateurs correspondant à la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
    );
    const upsertedTrajectoireIndicateurValeurs =
      await this.valeursService.upsertIndicateurValeurs(
        indicateurValeursTrajectoireResultat,
        undefined // we don't want to check permission, we have already checked it and it's not the same
      );

    // Maintenant que les indicateurs ont été créés, on peut ajouter la collectivité au groupement
    await this.groupementsService.ajouteCollectiviteAuGroupement(
      groupement.id,
      request.collectiviteId
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
      this.valeursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatEmissionsDefinitions,
        true
      );

    const consommationsTrajectoire =
      this.valeursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatConsommationDefinitions,
        true
      );

    const sequestrationTrajectoire =
      this.valeursService.groupeIndicateursValeursParIndicateur(
        upsertedTrajectoireIndicateurValeurs || [],
        indicateurResultatSequestrationDefinitions,
        true
      );

    const result: CalculTrajectoireResult = {
      mode: mode,
      sourcesDonneesEntree: resultatVerification.donneesEntree!.sources,
      indentifiantsReferentielManquantsDonneesEntree: [
        ...resultatVerification.donneesEntree!.emissionsGes
          .identifiantsReferentielManquants,
        ...resultatVerification.donneesEntree!.sequestrations
          .identifiantsReferentielManquants,
        ...resultatVerification.donneesEntree!.consommationsFinales
          .identifiantsReferentielManquants,
      ],
      spreadsheetId: trajectoireCalculSheetId,
      trajectoire: {
        emissionsGes: emissionGesTrajectoire,
        consommationsFinales: consommationsTrajectoire,
        sequestrations: sequestrationTrajectoire,
      },
    };

    this.inverseSigneSequestrations(result);
    return result;
  }

  inverseSigneSequestrations(result: CalculTrajectoireResult) {
    // Il y a le cae_1.csc qui est une exception
    result.trajectoire.emissionsGes.forEach((emissionGes) => {
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
    indicateurResultatDefinitions: IndicateurDefinition[],
    donneesCalculTrajectoire: DonneesCalculTrajectoireARemplirType
  ): IndicateurValeurInsert[] {
    const donneesEntree = [
      ...donneesCalculTrajectoire.emissionsGes.valeurs,
      ...donneesCalculTrajectoire.consommationsFinales.valeurs,
      ...donneesCalculTrajectoire.sequestrations.valeurs,
    ];
    const objectifCommentaire =
      this.trajectoiresDataService.getObjectifCommentaire(
        donneesCalculTrajectoire
      );

    const indicateurValeursResultat: IndicateurValeurInsert[] = [];
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
              v.identifiantsReferentiel.includes(identifiant)
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

                let facteur = 1;
                const signeInversionSequestration =
                  this.signeInversionSequestration(
                    indicateurResultatDefinition.identifiantReferentiel
                  );
                if (signeInversionSequestration) {
                  // Les valeurs de séquestration sont positives en base quand il y a une séquestration mais la convention inverse est dans l'excel
                  facteur = -1;
                }
                const indicateurValeur: IndicateurValeurInsert = {
                  indicateurId: indicateurResultatDefinition.id,
                  collectiviteId,
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
