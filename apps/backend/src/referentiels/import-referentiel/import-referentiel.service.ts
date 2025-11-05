import ListPersonnalisationQuestionsService from '@/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { personnalisationRegleTable } from '@/backend/collectivites/personnalisations/models/personnalisation-regle.table';
import PersonnalisationsExpressionService from '@/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import {
  CreateIndicateurActionType,
  indicateurActionTable,
} from '@/backend/indicateurs/definitions/indicateur-action.table';
import { ListDefinitionIdsRepository } from '@/backend/indicateurs/definitions/list-platform-predefined-definitions/list-definition-ids.repository';
import { ListDefinitionsLightRepository } from '@/backend/indicateurs/definitions/list-platform-predefined-definitions/list-definitions-light.repository';
import IndicateurExpressionService from '@/backend/indicateurs/valeurs/indicateur-expression.service';
import { ReferencedIndicateur } from '@/backend/indicateurs/valeurs/referenced-indicateur.dto';
import ImportPreuveReglementaireDefinitionService from '@/backend/referentiels/import-preuve-reglementaire-definitions/import-preuve-reglementaire-definition.service';
import {
  ImportActionDefinitionCoremeasureType,
  importActionDefinitionSchema,
  ImportActionDefinitionType,
} from '@/backend/referentiels/import-referentiel/import-action-definition.dto';
import { actionRelationTable } from '@/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@/backend/referentiels/models/question-action.table';
import {
  ReferentielLabelEnum,
  referentielLabelEnumSchema,
} from '@/backend/referentiels/models/referentiel-label.enum';
import BaseSpreadsheetImporterService from '@/backend/shared/services/base-spreadsheet-importer.service';
import { BackendConfigurationType } from '@/backend/utils/config/configuration.model';
import ConfigurationService from '@/backend/utils/config/configuration.service';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import { DatabaseService } from '@/backend/utils/database/database.service';
import SheetService from '@/backend/utils/google-sheets/sheet.service';
import VersionService from '@/backend/utils/version/version.service';
import {
  PersonnalisationRegleCreate,
  regleTypeEnumValues,
} from '@/domain/collectivites';
import {
  ActionDefinitionCreate,
  ActionDefinitionTag,
  ActionOrigine,
  ActionQuestion,
  ActionRelationCreate,
  ActionTypeEnum,
  getActionTypeFromActionId,
  getParentIdFromActionId,
  ReferentielDefinition,
  ReferentielId,
  ReferentielIdEnum,
  ReferentielTag,
} from '@/domain/referentiels';
import { getErrorMessage } from '@/domain/utils';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { eq, ilike, like } from 'drizzle-orm';
import { isNil, uniq } from 'es-toolkit';
import { actionOrigineTable } from '../correlated-actions/action-origine.table';
import { GetReferentielDefinitionService } from '../definitions/get-referentiel-definition/get-referentiel-definition.service';
import {
  GetReferentielService,
  ReferentielResponse,
} from '../get-referentiel/get-referentiel.service';
import { actionDefinitionTagTable } from '../models/action-definition-tag.table';
import { actionDefinitionTable } from '../models/action-definition.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { referentielTagTable } from '../models/referentiel-tag.table';

const REFERENTIEL_SPREADSHEET_RANGE = 'Structure référentiel!A:Z';
const ACTION_ID_REGEXP = /^[a-zA-Z]+_\d+(\.\d+)*$/;
const ORIGIN_NEW_ACTION_PREFIX = 'nouvelle';

const REFERENTIEL_ID_TO_CONFIG_KEY: Record<
  ReferentielId,
  keyof BackendConfigurationType
> = {
  te: 'REFERENTIEL_TE_SHEET_ID',
  'te-test': 'REFERENTIEL_TE_SHEET_ID',
  cae: 'REFERENTIEL_CAE_SHEET_ID',
  eci: 'REFERENTIEL_ECI_SHEET_ID',
};

// ces types peuvent avoir des points (ou un pourcentage)
const ACTION_TYPE_WITH_POINTS = [
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
];

@Injectable()
export class ImportReferentielService extends BaseSpreadsheetImporterService {
  readonly logger = new Logger(ImportReferentielService.name);

  constructor(
    private readonly config: ConfigurationService,
    private readonly database: DatabaseService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService,
    private readonly indicateurExpressionService: IndicateurExpressionService,
    private readonly indicateurDefinitionsLightRepo: ListDefinitionsLightRepository,
    private readonly listDefinitionIdsRepository: ListDefinitionIdsRepository,
    private readonly importPreuveReglementaireDefinitionService: ImportPreuveReglementaireDefinitionService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService,
    private readonly referentielService: GetReferentielService,
    private readonly referentielDefinitionService: GetReferentielDefinitionService,
    private readonly versionService: VersionService,
    readonly sheetService: SheetService
  ) {
    super(sheetService);
  }

  async importReferentiel(
    referentielId: ReferentielId
  ): Promise<ReferentielResponse> {
    const spreadsheetId = this.getReferentielSpreadsheetId(referentielId);
    this.logger.log(
      `Import du référentiel ${referentielId} depuis le spreadsheet ${spreadsheetId}`
    );

    const referentielDefinitions =
      await this.referentielDefinitionService.getReferentielDefinitions();
    const referentielDefinition = referentielDefinitions.find(
      (definition) => definition.id === referentielId
    );
    if (!referentielDefinition) {
      throw new NotFoundException(
        `Referentiel definition ${referentielId} not found`
      );
    }

    if (referentielDefinition.locked) {
      throw new ForbiddenException(
        `Le référentiel ${referentielId} est verrouillé, veuillez demander à un administrateur de le déverrouiller.`
      );
    }

    await this.createReferentielTagsIfNeeded();
    const allowVersionOverwrite =
      this.versionService.getVersion().environment !== 'prod';
    const isNewReferentiel =
      referentielId === 'te' || referentielId === 'te-test';

    // Update the version (will be saved in the transaction at the end)
    referentielDefinition.version = await this.checkLastVersion(
      spreadsheetId,
      referentielDefinition.version,
      allowVersionOverwrite
    );

    // Get all existing action ids, to be able to check origine validity
    const existingActionIds = (
      await this.database.db
        .select({
          action_id: actionRelationTable.id,
        })
        .from(actionRelationTable)
    ).map((action) => action.action_id);

    const questions =
      await this.listPersonnalisationQuestionsService.listQuestionsWithChoices();

    const importActionDefinitions =
      await this.sheetService.getDataFromSheet<ImportActionDefinitionType>(
        spreadsheetId,
        importActionDefinitionSchema,
        REFERENTIEL_SPREADSHEET_RANGE,
        ['identifiant']
      );

    const actionDefinitions: ActionDefinitionCreate[] = [];
    const createActionOrigines: ActionOrigine[] = [];
    const createPersonnalisationRegles: PersonnalisationRegleCreate[] = [];
    const indicateurIdentifiants: { identifiant: string; actionId: string }[] =
      [];
    const personnalisationQuestionRelations: ActionQuestion[] = [];
    const createActionTags: ActionDefinitionTag[] = [];
    importActionDefinitions.data.forEach((action) => {
      const actionId = `${referentielId}_${action.identifiant}`;
      const alreadyExists = actionDefinitions.find(
        (action) => action.actionId === actionId
      );
      if (!alreadyExists) {
        const actionType = getActionTypeFromActionId(
          actionId,
          referentielDefinition.hierarchie
        );
        const createActionDefinition: ActionDefinitionCreate = {
          identifiant: action.identifiant,
          actionId,
          nom: action.nom || '',
          description: action.description || '',
          contexte: action.contexte || '',
          exemples: action.exemples || '',
          ressources: action.ressources || '',
          reductionPotentiel: action.reductionPotentiel || '',
          perimetreEvaluation: action.perimetreEvaluation || '',
          preuve: action.preuve || '',
          points: null,
          pourcentage: null,
          categorie: action.categorie || null,
          referentiel: referentielId,
          referentielId: referentielDefinition.id,
          referentielVersion: referentielDefinition.version,
          exprScore: action.exprScore,
        };

        if (
          isNewReferentiel
            ? actionType === ActionTypeEnum.SOUS_ACTION
            : ACTION_TYPE_WITH_POINTS.includes(actionType)
        ) {
          createActionDefinition.points = action.points;
          createActionDefinition.pourcentage = action.pourcentage;
          if (
            isNil(createActionDefinition.points) &&
            isNil(createActionDefinition.pourcentage)
          ) {
            const message = `Action ${actionId} is missing points or percentage`;
            if (isNewReferentiel) {
              // ce cas est bloquant pour le nouveau référentiel
              throw new UnprocessableEntityException(message);
            } else if (actionType === ActionTypeEnum.SOUS_ACTION) {
              this.logger.log(message);
            }
          }
        }
        actionDefinitions.push(createActionDefinition);

        if (action.labels) {
          action.labels.forEach((label) => {
            const labelEnum = referentielLabelEnumSchema.safeParse(label);
            if (!labelEnum.success) {
              throw new UnprocessableEntityException(
                `Invalid label ${label} for action ${actionId}, allowed values are: ${Object.values(
                  ReferentielLabelEnum
                ).join(', ')}`
              );
            }

            const labelTag: ActionDefinitionTag = {
              referentielId: referentielId,
              actionId: createActionDefinition.actionId,
              tagRef: label,
            };
            createActionTags.push(labelTag);
          });
        }

        if (
          action.coremeasure ===
          ImportActionDefinitionCoremeasureType.COREMEASURE
        ) {
          // add associated tag
          const coremeasureTag: ActionDefinitionTag = {
            referentielId: referentielId,
            actionId: createActionDefinition.actionId,
            tagRef: ImportActionDefinitionCoremeasureType.COREMEASURE,
          };
          createActionTags.push(coremeasureTag);
        }

        regleTypeEnumValues.forEach((ruleType) => {
          if (action[ruleType]) {
            const regle: PersonnalisationRegleCreate = {
              actionId: createActionDefinition.actionId,
              type: ruleType,
              formule: action[ruleType],
              description: action[`${ruleType}Desc`] || '',
            };
            // Check that we can parse the expression
            try {
              this.personnalisationsExpressionService.parseExpression(
                regle.formule
              );
            } catch (e) {
              throw new UnprocessableEntityException(
                `Invalid ${ruleType} expression ${
                  action[ruleType]
                } for action ${actionId}: ${getErrorMessage(e)}`
              );
            }
            createPersonnalisationRegles.push(regle);
          }
        });

        if (action.origine) {
          const parsedActionOrigines = parseActionsOrigine(
            referentielId,
            createActionDefinition.actionId,
            action.origine,
            referentielDefinitions,
            existingActionIds
          );
          createActionOrigines.push(...parsedActionOrigines);
          // Create tags for origine referentiels
          const origineReferentiels = [
            ...new Set(
              parsedActionOrigines.map(
                (origine) => origine.origineReferentielId
              )
            ).values(),
          ];
          origineReferentiels.forEach((origineReferentiel) => {
            const origineTag: ActionDefinitionTag = {
              referentielId: referentielId,
              actionId: createActionDefinition.actionId,
              tagRef: origineReferentiel,
            };
            createActionTags.push(origineTag);
          });
        }

        if (action.exprScore) {
          try {
            this.indicateurExpressionService.parseExpression(action.exprScore);
          } catch (e) {
            throw new UnprocessableEntityException(
              `Invalid score expression for action ${actionId}: ${getErrorMessage(
                e
              )}`
            );
          }
          const referencedIndicateurs =
            this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
              action.exprScore
            );
          if (referencedIndicateurs.length) {
            this.logger.log(
              `Action ${actionId} reference indicateurs: ${referencedIndicateurs
                .map(({ identifiant }) => identifiant)
                .join(',')}`
            );
            indicateurIdentifiants.push(
              ...referencedIndicateurs.map(({ identifiant }) => ({
                identifiant,
                actionId,
              }))
            );
          }
        }

        if (action.indicateurs) {
          this.logger.log(
            `Action ${actionId} is linked to indicateurs: ${action.indicateurs.join(
              ','
            )}`
          );
          action.indicateurs?.forEach((identifiant) => {
            const existingRelations = indicateurIdentifiants.find(
              (relation) =>
                relation.identifiant === identifiant &&
                relation.actionId === actionId
            );
            if (!existingRelations) {
              indicateurIdentifiants.push({
                identifiant,
                actionId,
              });
            }
          });
        }

        if (action.personnalisationQuestions) {
          this.logger.log(
            `Action ${actionId} is linked to personnalisation questions: ${action.personnalisationQuestions.join(
              ','
            )}`
          );
          action.personnalisationQuestions?.forEach((questionId) => {
            const question = questions.find(
              (question) => question.id === questionId
            );
            if (!question) {
              throw new UnprocessableEntityException(
                `Personnalisation question ${questionId} not found`
              );
            }

            const existingRelation = personnalisationQuestionRelations.find(
              (relation) =>
                relation.questionId === questionId &&
                relation.actionId === actionId
            );
            if (!existingRelation) {
              personnalisationQuestionRelations.push({
                questionId,
                actionId,
              });
            }
          });
        }
      } else {
        throw new UnprocessableEntityException(
          `Action ${actionId} is duplicated in the spreadsheet`
        );
      }
    });
    // Add root action
    actionDefinitions.push({
      actionId: referentielId,
      identifiant: '',
      nom: referentielDefinition.nom,
      description: '',
      contexte: '',
      exemples: '',
      ressources: '',
      reductionPotentiel: '',
      perimetreEvaluation: '',
      preuve: '',
      referentiel: referentielId,
      referentielId: referentielDefinition.id,
      referentielVersion: referentielDefinition.version,
      exprScore: '',
    });

    // Sort to create parent relations in the right order
    actionDefinitions.sort((a, b) => {
      return a.actionId.localeCompare(b.actionId);
    });
    const actionRelations: ActionRelationCreate[] = [];
    actionDefinitions.forEach((action) => {
      const parent = getParentIdFromActionId(action.actionId);
      if (parent) {
        const foundParent = actionDefinitions.find(
          (action) => action.actionId === parent
        );
        if (foundParent) {
          const actionRelation: ActionRelationCreate = {
            id: action.actionId,
            parent: parent,
            referentiel: referentielId,
          };
          actionRelations.push(actionRelation);
        } else {
          throw new UnprocessableEntityException(
            `Action parent ${parent} not found for action ${action.actionId}`
          );
        }
      } else {
        // Root action
        const actionRelation: ActionRelationCreate = {
          id: action.actionId,
          parent: null,
          referentiel: referentielId,
        };
        actionRelations.push(actionRelation);
      }
    });

    // liste les indicateurs utilisés dans les formules de calcul du score
    let createIndicateurActions: CreateIndicateurActionType[] = [];
    if (indicateurIdentifiants.length) {
      const identifiants = indicateurIdentifiants.map(
        ({ identifiant }) => identifiant
      );
      const indicateurIdParIdentifiant =
        await this.listDefinitionIdsRepository.listDefinitionIdsByIdentifiantReferentiels(
          identifiants
        );
      createIndicateurActions = indicateurIdentifiants
        .map(({ identifiant, actionId }) => ({
          indicateurId: indicateurIdParIdentifiant[identifiant],
          actionId,
        }))
        .filter(({ indicateurId }) => indicateurId);
      this.logger.log(
        `${createIndicateurActions.length} indicateur-action relations to upsert due to score expressions`
      );
    }

    await this.database.db.transaction(async (tx) => {
      await tx
        .insert(actionRelationTable)
        .values(actionRelations)
        .onConflictDoNothing();

      const columnsToUpdate = [
        'nom',
        'description',
        'categorie',
        'contexte',
        'exemples',
        'ressources',
        'reductionPotentiel',
        'perimetreEvaluation',
        'preuve',
        'referentielVersion',
        'exprScore',
        'points',
        'pourcentage',
      ];

      await tx
        .insert(actionDefinitionTable)
        .values(actionDefinitions)
        .onConflictDoUpdate({
          target: [actionDefinitionTable.actionId],
          set: buildConflictUpdateColumns(
            actionDefinitionTable,
            columnsToUpdate as any
          ),
        });

      await tx
        .delete(actionOrigineTable)
        .where(eq(actionOrigineTable.referentielId, referentielId));

      if (createActionOrigines.length) {
        await tx.insert(actionOrigineTable).values(createActionOrigines);
      }

      // Delete & recreate tags
      await tx
        .delete(actionDefinitionTagTable)
        .where(eq(actionDefinitionTagTable.referentielId, referentielId));

      if (createActionTags.length) {
        await tx.insert(actionDefinitionTagTable).values(createActionTags);
      }

      // Delete personnalisation rules
      tx.delete(personnalisationRegleTable).where(
        like(personnalisationRegleTable.actionId, `${referentielId}_%`)
      );

      // Create personnalisation rules
      await tx
        .insert(personnalisationRegleTable)
        .values(createPersonnalisationRegles)
        .onConflictDoUpdate({
          target: [
            personnalisationRegleTable.actionId,
            personnalisationRegleTable.type,
          ],
          set: buildConflictUpdateColumns(personnalisationRegleTable, [
            'formule',
            'description',
          ]),
        });

      // relations action personnalisation question
      this.logger.log(
        `Recreating ${personnalisationQuestionRelations.length} personnalisation question action relations`
      );
      await tx
        .delete(questionActionTable)
        .where(ilike(questionActionTable.actionId, `${referentielId}%`));
      if (personnalisationQuestionRelations.length) {
        await tx
          .insert(questionActionTable)
          .values(personnalisationQuestionRelations);
      }

      // relations action indicateur
      this.logger.log(
        `Recreating ${createIndicateurActions.length} indicateur action relations`
      );
      await tx
        .delete(indicateurActionTable)
        .where(ilike(indicateurActionTable.actionId, `${referentielId}%`));
      if (createIndicateurActions.length) {
        await tx.insert(indicateurActionTable).values(createIndicateurActions);
      }

      await tx
        .insert(referentielDefinitionTable)
        .values(referentielDefinition)
        .onConflictDoUpdate({
          target: [referentielDefinitionTable.id],
          set: buildConflictUpdateColumns(referentielDefinitionTable, [
            'version',
          ]),
        });

      await this.importPreuveReglementaireDefinitionService.importPreuveReglementaireDefinitionsAndActionRelations(
        referentielId,
        spreadsheetId,
        importActionDefinitions.data,
        tx
      );
    });

    this.logger.log(`Import du référentiel ${referentielId} terminé`);

    return this.referentielService.getReferentielTree(
      referentielId,
      false,
      true,
      true
    );
  }

  async verifyReferentiel(referentielId: ReferentielId) {
    const spreadsheetId = this.getReferentielSpreadsheetId(referentielId);
    this.logger.log(
      `Vérification des formules du référentiel ${referentielId} depuis le spreadsheet ${spreadsheetId}`
    );

    const importActionDefinitions =
      await this.sheetService.getDataFromSheet<ImportActionDefinitionType>(
        spreadsheetId,
        importActionDefinitionSchema,
        REFERENTIEL_SPREADSHEET_RANGE,
        ['identifiant']
      );

    await this.verifyReferentielExpressions(
      referentielId,
      importActionDefinitions.data
    );

    await this.importPreuveReglementaireDefinitionService.verifyReferentielPreuveReglementaireDefinitionsAndActionRelations(
      referentielId,
      spreadsheetId,
      importActionDefinitions.data
    );

    return { ok: true };
  }

  async verifyReferentielExpressions(
    referentielId: ReferentielId,
    actions: Array<
      Pick<
        ImportActionDefinitionType,
        | 'identifiant'
        | 'desactivation'
        | 'reduction'
        | 'score'
        | 'exprScore'
        | 'indicateurs'
      >
    >
  ) {
    await this.verifyReferentielPersonnalisationExpressions(
      referentielId,
      actions
    );
    await this.verifyReferentielIndicateursAndScoreIndicatifExpressions(
      referentielId,
      actions
    );
    return true;
  }

  private async verifyReferentielPersonnalisationExpressions(
    referentielId: ReferentielId,
    actions: Array<
      Pick<
        ImportActionDefinitionType,
        'identifiant' | 'desactivation' | 'reduction' | 'score'
      >
    >
  ) {
    actions.forEach((action) => {
      const actionId = `${referentielId}_${action.identifiant}`;
      regleTypeEnumValues.forEach((ruleType) => {
        if (action[ruleType]) {
          try {
            this.personnalisationsExpressionService.parseExpression(
              action[ruleType]
            );
            // TODO: extract questions from expression to check that the question exists. Need to output questionIds and answerIds from the parser
            // Ex: eci 2.2 desactivation: reponse(dechets_1, NON) => we have to check that the question dechets_1 exists and that it's a binary question
          } catch (e) {
            throw new UnprocessableEntityException(
              `Invalid ${ruleType} expression "${
                action[ruleType]
              }" for action ${actionId}: ${getErrorMessage(e)}`
            );
          }
        }
      });
    });
  }

  private async verifyReferentielIndicateursAndScoreIndicatifExpressions(
    referentielId: ReferentielId,
    actions: Array<
      Pick<
        ImportActionDefinitionType,
        'identifiant' | 'exprScore' | 'indicateurs'
      >
    >
  ) {
    const references: Array<{
      actionId: string;
      expr: string | null;
      exprIndicateurs: ReferencedIndicateur[] | null;
      indicateurs: string[];
    }> = [];

    actions.forEach((action) => {
      const actionId = `${referentielId}_${action.identifiant}`;

      if (action.exprScore) {
        try {
          this.indicateurExpressionService.parseExpression(action.exprScore);
        } catch (e) {
          throw new UnprocessableEntityException(
            `Invalid score expression "${
              action.exprScore
            }" for action ${actionId}: ${getErrorMessage(e)}`
          );
        }
        const expressionIndicateurs =
          this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
            action.exprScore
          );
        references.push({
          actionId,
          expr: action.exprScore,
          exprIndicateurs: expressionIndicateurs,
          indicateurs: expressionIndicateurs.map((ind) => ind.identifiant),
        });
      }

      if (action.indicateurs) {
        references.push({
          actionId,
          expr: null,
          exprIndicateurs: null,
          indicateurs: action.indicateurs,
        });
      }
    });

    // vérifie la présence des indicateurs référencés dans les formules et dans le champ indicateurs
    const identifiants = uniq([
      ...references.flatMap((ref) => ref.indicateurs),
    ]);
    const indicateurIdParIdentifiant =
      await this.listDefinitionIdsRepository.listDefinitionIdsByIdentifiantReferentiels(
        identifiants
      );

    const identifiantsManquants = identifiants.filter(
      (identifiant) => !indicateurIdParIdentifiant[identifiant]
    );

    if (identifiantsManquants.length) {
      const referencesManquantes = references
        .map((ref) => ({
          ...ref,
          indicateurs: ref.indicateurs.filter((ind) =>
            identifiantsManquants.includes(ind)
          ),
        }))
        .filter((ref) => ref.indicateurs.length);

      throw new NotFoundException(
        `Missing indicateurs: ${referencesManquantes
          .map(
            (r) =>
              `${r.indicateurs.map((ind) => `"${ind}"`).join(', ')} into ${
                r.expr ? `expression "${r.expr}"` : 'indicateur list'
              } of action ${r.actionId}`
          )
          .join('\n')}`
      );
    }

    // vérifie la présence des valeurs limite/cible référencées dans les formules
    type ReferenceValeurCibleOuLimite = {
      indicateurId: number;
      actionId: string;
      expr: string;
    };
    const referencesValeur: {
      limite: ReferenceValeurCibleOuLimite[];
      cible: ReferenceValeurCibleOuLimite[];
    } = { limite: [], cible: [] };

    references.forEach((ref) => {
      if (!ref.expr) {
        return;
      }
      ref.exprIndicateurs?.forEach((ind) => {
        const valeurCibleRequise = ind.tokens.includes('cible');
        const valeurLimiteRequise = ind.tokens.includes('limite');
        const indicateurId = indicateurIdParIdentifiant[ind.identifiant];
        if (valeurCibleRequise || valeurLimiteRequise) {
          const refValeur = {
            indicateurId,
            actionId: ref.actionId,
            expr: ref.expr || '',
          };
          if (valeurCibleRequise) {
            referencesValeur.cible.push(refValeur);
          }
          if (valeurLimiteRequise) {
            referencesValeur.limite.push(refValeur);
          }
        }
      });
    });

    if (referencesValeur.limite.length || referencesValeur.cible.length) {
      const indicateurIds = uniq(
        [...referencesValeur.limite, ...referencesValeur.cible].map(
          (ref) => ref.indicateurId
        )
      );

      const definitions =
        await this.indicateurDefinitionsLightRepo.listDefinitionsLight({
          indicateurIds,
        });

      const exprManquantes: string[] = [];
      const verifExprManquante = (
        type: 'cible' | 'limite',
        indicateurId: number,
        identifiantReferentiel: string
      ) => {
        const ref = referencesValeur[type].find(
          (ref) => ref.indicateurId === indicateurId
        );
        if (ref) {
          exprManquantes.push(
            `Missing value/expression "${type}" for indicateur "${identifiantReferentiel}" used into expression "${ref.expr}" of action ${ref.actionId}`
          );
        }
      };

      definitions.forEach((definition) => {
        const { id, exprCible, identifiantReferentiel, exprSeuil } = definition;
        if (identifiantReferentiel) {
          if (!exprCible)
            verifExprManquante('cible', id, identifiantReferentiel);
          if (!exprSeuil)
            verifExprManquante('limite', id, identifiantReferentiel);
        }
      });

      if (exprManquantes.length) {
        throw new NotFoundException(exprManquantes.join('\n'));
      }
    }
  }

  private getReferentielSpreadsheetId(referentielId: ReferentielId): string {
    const spreadsheetId = this.config.get(
      REFERENTIEL_ID_TO_CONFIG_KEY[referentielId]
    );
    if (spreadsheetId) {
      return spreadsheetId;
    }

    throw new HttpException(
      `Referentiel ${referentielId} cannot be imported, missing configuration`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  private async createReferentielTagsIfNeeded(): Promise<void> {
    const referentielTags: ReferentielTag[] = [
      {
        ref: ReferentielIdEnum.CAE,
        nom: 'CAE',
        type: 'Catalogue',
      },
      {
        ref: ReferentielIdEnum.ECI,
        nom: 'ECI',
        type: 'Catalogue',
      },
      {
        ref: ImportActionDefinitionCoremeasureType.COREMEASURE,
        nom: 'EEA Coremeasure',
        type: 'EEA',
      },
      {
        ref: ReferentielLabelEnum.TE_ECI,
        nom: 'Label TE ECI',
        type: 'Label',
      },
      {
        ref: ReferentielLabelEnum.TE_CAE,
        nom: 'Label TE CAE',
        type: 'Label',
      },
    ];

    await this.database.db
      .insert(referentielTagTable)
      .values(referentielTags)
      .onConflictDoNothing();
  }
}

export function parseActionsOrigine(
  referentielId: ReferentielId,
  actionId: string,
  origine: string,
  referentielDefinitions: ReferentielDefinition[],
  existingActionIds?: string[]
): ActionOrigine[] {
  const createActionOrigines: {
    [actionKey: string]: ActionOrigine;
  } = {};
  const lowerCaseOrigine = origine.toLowerCase();
  if (!lowerCaseOrigine.startsWith(ORIGIN_NEW_ACTION_PREFIX)) {
    const origineParts = lowerCaseOrigine
      .split('\n')
      .map((originePart) => originePart.trim());
    origineParts.forEach((originePart) => {
      const originePartPonderationSplit = originePart.split('(');
      let ponderation = 1;

      if (originePartPonderationSplit.length > 1) {
        ponderation = parseFloat(
          originePartPonderationSplit[1].replace(')', '').replace(',', '.')
        );
        if (isNaN(ponderation)) {
          throw new UnprocessableEntityException(
            `Invalid ponderation value ${originePartPonderationSplit[1]} for origine ${originePart} of action ${actionId}`
          );
        }
      }

      const origineActionId = originePartPonderationSplit[0].trim();
      const originePartReferentielSplit = origineActionId.split('_');

      if (
        originePartReferentielSplit.length !== 2 ||
        !ACTION_ID_REGEXP.test(origineActionId)
      ) {
        throw new UnprocessableEntityException(
          `Invalid origine value ${originePart} for action ${actionId}`
        );
      }
      const origineReferentielId = originePartReferentielSplit[0];
      const foundReferentiel = referentielDefinitions.find(
        (definition) => definition.id === origineReferentielId
      );

      if (!foundReferentiel) {
        throw new UnprocessableEntityException(
          `Invalid origine value referentiel ${originePart} (referentiel ${origineReferentielId}) for action ${actionId}`
        );
      }

      if (existingActionIds && !existingActionIds.includes(origineActionId)) {
        throw new UnprocessableEntityException(
          `Invalid origine value action ${originePart} (extracted actionId ${origineActionId} not found) for action ${actionId}`
        );
      }

      const createActionOrigine: ActionOrigine = {
        referentielId: referentielId,
        actionId: actionId,
        origineReferentielId: origineReferentielId,
        origineActionId: origineActionId,
        ponderation: ponderation,
      };

      if (!createActionOrigines[createActionOrigine.origineActionId]) {
        createActionOrigines[createActionOrigine.origineActionId] =
          createActionOrigine;
      } else {
        throw new UnprocessableEntityException(
          `Duplicate origine ${createActionOrigine.origineActionId} for action ${actionId}`
        );
      }
    });
  }
  return Object.values(createActionOrigines);
}
