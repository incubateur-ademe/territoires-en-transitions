import { ListDefinitionsService } from '@/backend/indicateurs/list-definitions/list-definitions.service';
import {
  CreateIndicateurActionType,
  indicateurActionTable,
} from '@/backend/indicateurs/shared/models/indicateur-action.table';
import IndicateurExpressionService from '@/backend/indicateurs/valeurs/indicateur-expression.service';
import {
  PersonnalisationRegleInsert,
  personnalisationRegleTable,
  regleType,
} from '@/backend/personnalisations/models/personnalisation-regle.table';
import PersonnalisationsExpressionService from '@/backend/personnalisations/services/personnalisations-expression.service';
import BaseSpreadsheetImporterService from '@/backend/shared/services/base-spreadsheet-importer.service';
import { DatabaseService } from '@/backend/utils';
import { BackendConfigurationType } from '@/backend/utils/config/configuration.model';
import ConfigurationService from '@/backend/utils/config/configuration.service';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import SheetService from '@/backend/utils/google-sheets/sheet.service';
import { getErrorMessage } from '@/backend/utils/nest/errors.utils';
import VersionService from '@/backend/utils/version/version.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { eq, like } from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import z from 'zod';
import {
  ActionOrigineInsert,
  actionOrigineTable,
} from '../correlated-actions/action-origine.table';
import {
  GetReferentielService,
  ReferentielResponse,
} from '../get-referentiel/get-referentiel.service';
import {
  ActionCategorieEnum,
  ActionDefinitionInsert,
  actionDefinitionSchemaInsert,
  actionDefinitionTable,
  ActionRelationInsert,
  actionRelationTable,
  ActionTypeEnum,
  getActionTypeFromActionId,
  getParentIdFromActionId,
  ReferentielId,
  referentielIdEnumSchema,
} from '../index-domain';
import {
  ActionDefinitionTagInsert,
  actionDefinitionTagTable,
} from '../models/action-definition-tag.table';
import {
  ReferentielDefinition,
  referentielDefinitionTable,
} from '../models/referentiel-definition.table';
import {
  CreateReferentielTagType,
  referentielTagTable,
} from '../models/referentiel-tag.table';

export enum ImportActionDefinitionCoremeasureType {
  COREMEASURE = 'coremeasure',
}

export const importActionDefinitionSchema = actionDefinitionSchemaInsert
  .partial({
    actionId: true,
    description: true,
    nom: true,
    contexte: true,
    exemples: true,
    ressources: true,
    referentiel: true,
    referentielId: true,
    referentielVersion: true,
    reductionPotentiel: true,
    perimetreEvaluation: true,
    exprScore: true,
  })
  .extend({
    categorie: z
      .string()
      .toLowerCase()
      .pipe(z.nativeEnum(ActionCategorieEnum))
      .optional(),
    origine: z.string().optional(),
    coremeasure: z.string().optional(),
    /** règles de personnalisation */
    desactivation: z.string().optional(),
    desactivationDesc: z.string().optional(),
    score: z.string().optional(),
    scoreDesc: z.string().optional(),
    reduction: z.string().optional(),
    reductionDesc: z.string().optional(),
  });

export type ImportActionDefinitionType = z.infer<
  typeof importActionDefinitionSchema
>;

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
    private readonly indicateurDefinitionsService: ListDefinitionsService,
    private readonly referentielService: GetReferentielService,
    private readonly versionService: VersionService,
    readonly sheetService: SheetService
  ) {
    super(new Logger(ImportReferentielService.name), sheetService);
  }

  async importReferentiel(
    referentielId: ReferentielId
  ): Promise<ReferentielResponse> {
    const spreadsheetId = this.getReferentielSpreadsheetId(referentielId);
    this.logger.log(
      `Import du référentiel ${referentielId} depuis le spreadsheet ${spreadsheetId}`
    );

    const referentielDefinitions =
      await this.referentielService.getReferentielDefinitions();
    const referentielDefinition = referentielDefinitions.find(
      (definition) => definition.id === referentielId
    );
    if (!referentielDefinition) {
      throw new NotFoundException(
        `Referentiel definition ${referentielId} not found`
      );
    }

    if (referentielDefinition.locked) {
      this.logger.log(
        `Référentiel ${referentielId} verrouillé : les points/pourcentage et les règles de personnalisation ne seront pas importés.`
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

    const importActionDefinitions =
      await this.sheetService.getDataFromSheet<ImportActionDefinitionType>(
        spreadsheetId,
        importActionDefinitionSchema,
        REFERENTIEL_SPREADSHEET_RANGE,
        ['identifiant']
      );

    const actionDefinitions: ActionDefinitionInsert[] = [];
    const createActionOrigines: ActionOrigineInsert[] = [];
    const createPersonnalisationRegles: PersonnalisationRegleInsert[] = [];
    const indicateurIdentifiants: { identifiant: string; actionId: string }[] =
      [];
    const createActionTags: ActionDefinitionTagInsert[] = [];
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
        const createActionDefinition: ActionDefinitionInsert = {
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
          !referentielDefinition.locked &&
          (isNewReferentiel
            ? actionType === ActionTypeEnum.SOUS_ACTION
            : ACTION_TYPE_WITH_POINTS.includes(actionType))
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

        if (
          action.coremeasure ===
          ImportActionDefinitionCoremeasureType.COREMEASURE
        ) {
          // add associated tag
          const coremeasureTag: ActionDefinitionTagInsert = {
            referentielId: referentielId,
            actionId: createActionDefinition.actionId,
            tagRef: ImportActionDefinitionCoremeasureType.COREMEASURE,
          };
          createActionTags.push(coremeasureTag);
        }

        if (!referentielDefinition.locked) {
          regleType.forEach((ruleType) => {
            if (action[ruleType]) {
              const regle: PersonnalisationRegleInsert = {
                actionId: createActionDefinition.actionId,
                type: ruleType,
                formule: action[ruleType].toLowerCase(),
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
            }
          });
        }

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
            const origineTag: ActionDefinitionTagInsert = {
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
    const actionRelations: ActionRelationInsert[] = [];
    actionDefinitions.forEach((action) => {
      const parent = getParentIdFromActionId(action.actionId);
      if (parent) {
        const foundParent = actionDefinitions.find(
          (action) => action.actionId === parent
        );
        if (foundParent) {
          const actionRelation: ActionRelationInsert = {
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
        const actionRelation: ActionRelationInsert = {
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
        await this.indicateurDefinitionsService.getIndicateurIdByIdentifiant(
          identifiants
        );
      createIndicateurActions = indicateurIdentifiants
        .map(({ identifiant, actionId }) => ({
          indicateurId: indicateurIdParIdentifiant[identifiant],
          actionId,
          utiliseParExprScore: true,
        }))
        .filter(({ indicateurId }) => indicateurId);
      this.logger.log(
        `${createIndicateurActions.length} indicateur-action relations to upsert`
      );
    }

    await this.database.db.transaction(async (tx) => {
      await tx
        .insert(actionRelationTable)
        .values(actionRelations)
        .onConflictDoNothing();

      await tx
        .insert(actionDefinitionTable)
        .values(actionDefinitions)
        .onConflictDoUpdate({
          target: [actionDefinitionTable.actionId],
          set: buildConflictUpdateColumns(actionDefinitionTable, [
            'nom',
            'description',
            'categorie',
            'contexte',
            'exemples',
            'ressources',
            'reductionPotentiel',
            'perimetreEvaluation',
            'preuve',
            'points',
            'pourcentage',
            'referentielVersion',
            'exprScore',
          ]),
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

      if (!referentielDefinition.locked) {
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
      }

      // relations action indicateur
      if (createIndicateurActions.length) {
        await tx
          .insert(indicateurActionTable)
          .values(createIndicateurActions)
          .onConflictDoUpdate({
            target: [
              indicateurActionTable.actionId,
              indicateurActionTable.indicateurId,
            ],
            set: buildConflictUpdateColumns(indicateurActionTable, [
              'utiliseParExprScore',
            ]),
          });
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
    });

    this.logger.log(`Import du référentiel ${referentielId} terminé`);

    return this.referentielService.getReferentielTree(
      referentielId,
      false,
      true
    );
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
    const referentielTags: CreateReferentielTagType[] = [
      {
        ref: referentielIdEnumSchema.enum.cae,
        nom: 'CAE',
        type: 'Catalogue',
      },
      {
        ref: referentielIdEnumSchema.enum.eci,
        nom: 'ECI',
        type: 'Catalogue',
      },
      {
        ref: ImportActionDefinitionCoremeasureType.COREMEASURE,
        nom: 'EEA Coremeasure',
        type: 'EEA',
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
): ActionOrigineInsert[] {
  const createActionOrigines: {
    [actionKey: string]: ActionOrigineInsert;
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

      const createActionOrigine: ActionOrigineInsert = {
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
