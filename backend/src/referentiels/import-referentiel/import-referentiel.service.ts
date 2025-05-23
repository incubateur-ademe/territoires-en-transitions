import {
  PersonnalisationRegleInsert,
  personnalisationRegleTable,
} from '@/backend/personnalisations/models/personnalisation-regle.table';
import {
  personnalisationTable,
  PersonnalisationType,
} from '@/backend/personnalisations/models/personnalisation.table';
import ExpressionParserService from '@/backend/personnalisations/services/expression-parser.service';
import {
  changelogSchema,
  ChangelogType,
} from '@/backend/shared/models/changelog.dto';
import { DatabaseService } from '@/backend/utils';
import ConfigurationService from '@/backend/utils/config/configuration.service';
import SheetService from '@/backend/utils/google-sheets/sheet.service';
import { getErrorMessage } from '@/backend/utils/nest/errors.utils';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import semver from 'semver';
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
  })
  .extend({
    categorie: z
      .string()
      .toLowerCase()
      .pipe(z.nativeEnum(ActionCategorieEnum))
      .optional(),
    origine: z.string().optional(),
    coremeasure: z.string().optional(),
    desactivation: z.string().optional(),
  });

export type ImportActionDefinitionType = z.infer<
  typeof importActionDefinitionSchema
>;

const CHANGELOG_SPREADSHEET_RANGE = 'Versions!A:Z';
const REFERENTIEL_SPREADSHEET_RANGE = 'Structure référentiel!A:Z';
const ACTION_ID_REGEXP = /^[a-zA-Z]+_\d+(\.\d+)*$/;
const ORIGIN_NEW_ACTION_PREFIX = 'nouvelle';

@Injectable()
export class ImportReferentielService {
  private readonly logger = new Logger(ImportReferentielService.name);

  constructor(
    private readonly config: ConfigurationService,
    private readonly database: DatabaseService,
    private readonly sheetService: SheetService,
    private readonly expressionParserService: ExpressionParserService,
    private readonly referentielService: GetReferentielService
  ) {}

  async importReferentiel(
    referentielId: ReferentielId
  ): Promise<ReferentielResponse> {
    const spreadsheetId = this.getReferentielSpreadsheetId(referentielId);

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

    await this.createReferentielTagsIfNeeded();

    let changeLogVersions: ChangelogType[] = [];
    try {
      const changelogData =
        await this.sheetService.getDataFromSheet<ChangelogType>(
          spreadsheetId,
          changelogSchema,
          CHANGELOG_SPREADSHEET_RANGE,
          ['version']
        );
      changeLogVersions = changelogData.data;
    } catch (e) {
      throw new UnprocessableEntityException(
        'Impossible de lire le tableau de version, veuillez vérifier que tous les champs sont correctement remplis.'
      );
    }

    if (!changeLogVersions.length) {
      throw new UnprocessableEntityException(`No version found in changelog`);
    }

    let lastVersion = changeLogVersions[0].version;
    changeLogVersions.forEach((version) => {
      if (semver.gt(version.version, lastVersion)) {
        lastVersion = version.version;
      }
    });

    this.logger.log(`Last version found in changelog: ${lastVersion}`);

    if (!semver.gt(lastVersion, referentielDefinition.version)) {
      throw new UnprocessableEntityException(
        `Version ${lastVersion} is not greater than current version ${referentielDefinition.version}, please add a new version in the changelog`
      );
    } else {
      // Update the version (will be saved in the transaction at the end)
      referentielDefinition.version = lastVersion;
    }

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
    const deletePersonnalisationReglesActionIds: string[] = [];
    const createActionTags: ActionDefinitionTagInsert[] = [];
    importActionDefinitions.data.forEach((action) => {
      const actionId = `${referentielId}_${action.identifiant}`;
      const alreadyExists = actionDefinitions.find(
        (action) => action.actionId === actionId
      );
      if (!alreadyExists) {
        const createActionDefinition: ActionDefinitionInsert = {
          identifiant: action.identifiant,
          actionId: `${referentielId}_${action.identifiant}`,
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
        };

        const actionType = getActionTypeFromActionId(
          createActionDefinition.actionId,
          referentielDefinition.hierarchie
        );

        if (actionType === ActionTypeEnum.SOUS_ACTION) {
          createActionDefinition.points = action.points;
          if (isNil(createActionDefinition.points)) {
            throw new UnprocessableEntityException(
              `Action ${actionId} is missing points`
            );
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

        if (action.desactivation) {
          const desactivationRegle: PersonnalisationRegleInsert = {
            actionId: createActionDefinition.actionId,
            type: 'desactivation',
            formule: action.desactivation.toLowerCase(),
            description: '',
          };
          // Check that we can parse the expression
          try {
            this.expressionParserService.parseExpression(
              desactivationRegle.formule
            );
          } catch (e) {
            throw new UnprocessableEntityException(
              `Invalid desactivation expression ${
                action.desactivation
              } for action ${actionId}: ${getErrorMessage(e)}`
            );
          }
          createPersonnalisationRegles.push(desactivationRegle);
        } else {
          // If no desactivation, we remove the desactivation rule
          deletePersonnalisationReglesActionIds.push(
            createActionDefinition.actionId
          );
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
          set: {
            nom: sql.raw(`excluded.${actionDefinitionTable.nom.name}`),
            description: sql.raw(
              `excluded.${actionDefinitionTable.description.name}`
            ),
            categorie: sql.raw(
              `excluded.${actionDefinitionTable.categorie.name}`
            ),
            contexte: sql.raw(
              `excluded.${actionDefinitionTable.contexte.name}`
            ),
            exemples: sql.raw(
              `excluded.${actionDefinitionTable.exemples.name}`
            ),
            ressources: sql.raw(
              `excluded.${actionDefinitionTable.ressources.name}`
            ),
            reductionPotentiel: sql.raw(
              `excluded.${actionDefinitionTable.reductionPotentiel.name}`
            ),
            perimetreEvaluation: sql.raw(
              `excluded.${actionDefinitionTable.perimetreEvaluation.name}`
            ),
            preuve: sql.raw(`excluded.${actionDefinitionTable.preuve.name}`),
            points: sql.raw(`excluded.${actionDefinitionTable.points.name}`),
            pourcentage: sql.raw(
              `excluded.${actionDefinitionTable.pourcentage.name}`
            ),
            referentielVersion: sql.raw(
              `excluded.${actionDefinitionTable.referentielVersion.name}`
            ),
          },
        });

      await tx
        .delete(actionOrigineTable)
        .where(eq(actionOrigineTable.referentielId, referentielId));

      await tx.insert(actionOrigineTable).values(createActionOrigines);

      // Delete & recreate tags
      await tx
        .delete(actionDefinitionTagTable)
        .where(eq(actionDefinitionTagTable.referentielId, referentielId));

      await tx.insert(actionDefinitionTagTable).values(createActionTags);

      // Delete desactivation rules not needed anymore
      await tx
        .delete(personnalisationTable)
        .where(
          inArray(
            personnalisationTable.actionId,
            deletePersonnalisationReglesActionIds
          )
        );
      await tx
        .delete(personnalisationRegleTable)
        .where(
          inArray(
            personnalisationRegleTable.actionId,
            deletePersonnalisationReglesActionIds
          )
        );

      // Create desactivation rules
      const personnalisations = createPersonnalisationRegles.map((regle) => {
        const personnalisation: PersonnalisationType = {
          actionId: regle.actionId,
          titre: `Désactivation de ${regle.actionId}`,
          description: regle.description,
        };
        return personnalisation;
      });
      await tx
        .insert(personnalisationTable)
        .values(personnalisations)
        .onConflictDoUpdate({
          target: [personnalisationTable.actionId],
          set: {
            titre: sql.raw(`excluded.${personnalisationTable.titre.name}`),
            description: sql.raw(
              `excluded.${personnalisationTable.description.name}`
            ),
          },
        });
      await tx
        .insert(personnalisationRegleTable)
        .values(createPersonnalisationRegles)
        .onConflictDoUpdate({
          target: [
            personnalisationRegleTable.actionId,
            personnalisationRegleTable.type,
          ],
          set: {
            formule: sql.raw(
              `excluded.${personnalisationRegleTable.formule.name}`
            ),
            description: sql.raw(
              `excluded.${personnalisationRegleTable.description.name}`
            ),
          },
        });

      await tx
        .insert(referentielDefinitionTable)
        .values(referentielDefinition)
        .onConflictDoUpdate({
          target: [referentielDefinitionTable.id],
          set: {
            version: sql.raw(
              `excluded.${referentielDefinitionTable.version.name}`
            ),
          },
        });
    });

    return this.referentielService.getReferentielTree(
      referentielId,
      false,
      true
    );
  }

  private getReferentielSpreadsheetId(referentielId: ReferentielId): string {
    if (
      referentielId === referentielIdEnumSchema.enum.te ||
      referentielId === referentielIdEnumSchema.enum['te-test']
    ) {
      return this.config.get('REFERENTIEL_TE_SHEET_ID');
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
