import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, asc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import * as _ from 'lodash';
import * as semver from 'semver';
import DatabaseService from '../../common/services/database.service';
import { getErrorMessage } from '../../common/services/errors.helper';
import {
  CreatePersonnalisationRegleType,
  personnalisationRegleTable,
} from '../../personnalisations/models/personnalisation-regle.table';
import {
  personnalisationTable,
  PersonnalisationType,
} from '../../personnalisations/models/personnalisation.table';
import ExpressionParserService from '../../personnalisations/services/expression-parser.service';
import SheetService from '../../spreadsheets/services/sheet.service';
import ConfigurationService from '../../utils/config/config.service';
import {
  actionDefinitionTagTable,
  CreateActionDefinitionTagType,
} from '../models/action-definition-tag.table';
import {
  ActionDefinitionAvecParentType,
  actionDefinitionTable,
  CreateActionDefinitionType,
  ImportActionDefinitionCoremeasureType,
  importActionDefinitionSchema,
  ImportActionDefinitionType,
} from '../models/action-definition.table';
import {
  actionOrigineTable,
  CreateActionOrigineType,
} from '../models/action-origine.table';
import {
  actionRelationTable,
  CreateActionRelationType,
} from '../models/action-relation.table';
import { ActionType } from '../models/action-type.enum';
import { GetActionOrigineDtoSchema } from '../models/get-action-origine.dto';
import { GetReferentielResponseType } from '../models/get-referentiel.response';
import { ReferentielActionType } from '../models/referentiel-action.dto';
import {
  referentielChangelogSchema,
  ReferentielChangelogType,
} from '../models/referentiel-changelog.dto';
import {
  referentielDefinitionTable,
  ReferentielDefinitionType,
} from '../models/referentiel-definition.table';
import {
  CreateReferentielTagType,
  referentielTagTable,
} from '../models/referentiel-tag.table';
import { ReferentielType } from '../models/referentiel.enum';

@Injectable()
export default class ReferentielsService {
  private readonly logger = new Logger(ReferentielsService.name);

  private readonly CHANGELOG_SPREADSHEET_RANGE = 'Versions!A:Z';
  private readonly REFERENTIEL_SPREADSHEET_RANGE =
    'Structure référentiel TE!A:Z';
  private readonly ACTION_ID_REGEXP = /^[a-zA-Z]+_\d+(\.\d+)*$/;
  private readonly ORIGIN_NEW_ACTION_PREFIX = 'nouvelle';

  constructor(
    private readonly backendConfigurationService: ConfigurationService,
    private readonly databaseService: DatabaseService,
    private readonly sheetService: SheetService,
    private readonly expressionParserService: ExpressionParserService
  ) {}

  buildReferentielTree(
    actionDefinitions: ActionDefinitionAvecParentType[],
    orderedActionTypes: ActionType[],
    actionOrigines?: GetActionOrigineDtoSchema[] | null
  ): ReferentielActionType {
    const rootAction = actionDefinitions.find(
      (action) => !action.parentActionId
    );
    if (!rootAction) {
      throw new NotFoundException(`Referentiel not found`);
    }
    const { parentActionId, ...rootActionSansParent } = rootAction;
    const referentiel: ReferentielActionType = {
      ...rootActionSansParent,
      level: 0,
      actionType: orderedActionTypes[0],
      actionsEnfant: [],
      tags: [],
    };
    this.attacheActionsEnfant(
      referentiel,
      actionDefinitions,
      orderedActionTypes,
      referentiel.level,
      actionOrigines
    );

    return referentiel;
  }

  attacheActionsEnfant(
    referentiel: ReferentielActionType,
    actionDefinitions: ActionDefinitionAvecParentType[],
    orderActionTypes: ActionType[],
    currentLevel: number,
    actionOrigines?: GetActionOrigineDtoSchema[] | null
  ): void {
    const actionsEnfant = actionDefinitions.filter(
      (action) => action.parentActionId === referentiel.actionId
    );

    if (!referentiel.tags) {
      referentiel.tags = [];
    }
    // Ajoute la catégorie comme tag
    if (referentiel.categorie) {
      referentiel.tags.push(referentiel.categorie);
    }

    if (actionOrigines) {
      const associatedActionOrigines = actionOrigines.filter(
        (origine) => origine.actionId === referentiel.actionId
      );
      referentiel.actionsOrigine = associatedActionOrigines.map((origine) => ({
        referentielId: origine.origineReferentielId,
        actionId: origine.origineActionId,
        ponderation: origine.ponderation,
        nom: origine.origineActionNom || null,
      }));
      referentiel.referentielsOrigine = [
        ...new Set(
          associatedActionOrigines.map(
            (actionOrigine) => actionOrigine.origineReferentielId
          )
        ).values(),
      ];
    }

    if (actionsEnfant.length) {
      const levelEnfant = currentLevel + 1;
      if (levelEnfant >= orderActionTypes.length) {
        throw new HttpException(
          `Action level ${levelEnfant} non consistent with referentiel action types: ${orderActionTypes.join(
            ','
          )}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      const actionTypeEnfant = orderActionTypes[levelEnfant];

      const equiPercentage = actionsEnfant.every(
        (action) => !action.pourcentage && _.isNil(action.points)
      );
      if (equiPercentage) {
        // Enlève les actions réglementaires avec un pourcentage à 0
        const enfantSansPourcentage = actionsEnfant.filter((action) =>
          _.isNil(action.pourcentage)
        );
        actionsEnfant.forEach((action) => {
          if (_.isNil(action.pourcentage)) {
            action.pourcentage = 100 / enfantSansPourcentage.length;
          }
        });
      } else {
        //
        const hasPourcentage = actionsEnfant.some(
          (action) => action.pourcentage
        );
        if (hasPourcentage) {
          const totalPourcentage = actionsEnfant.reduce(
            (acc, action) => acc + (action.pourcentage || 0),
            0
          );
          if (totalPourcentage !== 100) {
            throw new HttpException(
              `Total pourcentage des actions enfant de ${referentiel.actionId} doit être égal à 100`,
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          }
        }
      }

      actionsEnfant.forEach((actionEnfant) => {
        const { parentActionId, ...actionEnfantSansParent } = actionEnfant;
        const actionEnfantDansReferentiel: ReferentielActionType = {
          ...actionEnfantSansParent,
          actionsEnfant: [],
          level: levelEnfant,
          actionType: actionTypeEnfant,
        };
        if (
          _.isNil(actionEnfantDansReferentiel.points) &&
          !_.isNil(actionEnfantDansReferentiel.pourcentage) &&
          !_.isNil(referentiel.points)
        ) {
          actionEnfantDansReferentiel.points =
            (referentiel.points * actionEnfantDansReferentiel.pourcentage) /
            100;
        }
        referentiel.actionsEnfant.push(actionEnfantDansReferentiel);
        this.attacheActionsEnfant(
          actionEnfantDansReferentiel,
          actionDefinitions,
          orderActionTypes,
          levelEnfant,
          actionOrigines
        );
      });

      // Maintenant que la recursion est terminée, on recalcule le score du parent et on met à jour le referentiel origine
      if (referentiel.actionsEnfant.length > 0) {
        if (_.isNil(referentiel.points)) {
          // Only if not already computed

          referentiel.points = referentiel.actionsEnfant.reduce(
            (acc, action) => acc + (action.points || 0),
            0
          );
        }
        referentiel.actionsEnfant.forEach((action) => {
          if (action.points && referentiel.points) {
            action.pourcentage = (action.points / referentiel.points) * 100;
          }
        });

        // We update the origine referentiels too
        if (actionOrigines) {
          referentiel.referentielsOrigine = [
            ...new Set(
              referentiel.actionsEnfant
                .map((actionEnfant) => actionEnfant.referentielsOrigine || [])
                .flat()
                .concat(referentiel.referentielsOrigine || [])
            ).values(),
          ];
        }
      }
    }
  }

  async getActionsOrigine(
    referentielId: ReferentielType
  ): Promise<GetActionOrigineDtoSchema[]> {
    return await this.databaseService.db
      .select({
        ...getTableColumns(actionOrigineTable),
        origine_action_nom: actionDefinitionTable.nom,
      })
      .from(actionOrigineTable)
      .leftJoin(
        actionDefinitionTable,
        eq(actionOrigineTable.origineActionId, actionDefinitionTable.actionId)
      )
      .where(
        eq(actionOrigineTable.referentielId, referentielId as ReferentielType)
      )
      .orderBy(asc(actionOrigineTable.actionId));
  }

  getActionDefinitionTagsQuery() {
    return this.databaseService.db
      .select({
        actionId: actionDefinitionTagTable.actionId,
        referentielId: actionDefinitionTagTable.referentielId,
        tags: sql`array_agg(${actionDefinitionTagTable.tagRef})`.as('tags'),
      })
      .from(actionDefinitionTagTable)
      .groupBy(
        actionDefinitionTagTable.actionId,
        actionDefinitionTagTable.referentielId
      )
      .as('action_tags');
  }

  async getReferentiel(
    referentielId: ReferentielType,
    onlyForScoring?: boolean,
    getActionsOrigine?: boolean
  ): Promise<GetReferentielResponseType> {
    this.logger.log(`Get referentiel ${referentielId}`);

    const referentielDefinition = await this.getReferentielDefinition(
      referentielId
    );

    const actionTagsQuery = this.getActionDefinitionTagsQuery();

    const colonnes = onlyForScoring
      ? {
          actionId: actionDefinitionTable.actionId,
          nom: actionDefinitionTable.nom,
          points: actionDefinitionTable.points,
          categorie: actionDefinitionTable.categorie,
          pourcentage: actionDefinitionTable.pourcentage,
        }
      : getTableColumns(actionDefinitionTable);
    const actionDefinitions = await this.databaseService.db
      .select({
        ...colonnes,
        parentActionId: actionRelationTable.parent,
        tags: actionTagsQuery.tags,
      })
      .from(actionDefinitionTable)
      .leftJoin(
        actionRelationTable,
        eq(actionDefinitionTable.actionId, actionRelationTable.id)
      )
      .leftJoin(
        actionTagsQuery,
        and(
          eq(actionDefinitionTable.actionId, actionTagsQuery.actionId),
          eq(actionDefinitionTable.referentielId, actionTagsQuery.referentielId)
        )
      )
      .where(
        and(
          eq(actionDefinitionTable.referentielId, referentielId),
          eq(
            actionDefinitionTable.referentielVersion,
            referentielDefinition.version
          )
        )
      )
      .orderBy(asc(actionDefinitionTable.actionId));
    this.logger.log(
      `${actionDefinitions.length} actions trouvees pour le referentiel ${referentielId}`
    );

    const actionOrigines = getActionsOrigine
      ? await this.getActionsOrigine(referentielId)
      : null;

    const actionsTree = this.buildReferentielTree(
      actionDefinitions,
      referentielDefinition.hierarchie,
      actionOrigines
    );

    return {
      itemsTree: actionsTree,
      version: referentielDefinition.version,
      orderedItemTypes: referentielDefinition.hierarchie,
    };
  }

  async getReferentielDefinitions(): Promise<ReferentielDefinitionType[]> {
    this.logger.log(`Getting referentiel definitions`);

    const referentielDefinitions = await this.databaseService.db
      .select()
      .from(referentielDefinitionTable);

    return referentielDefinitions;
  }

  async getReferentielDefinition(
    referentielId: ReferentielType
  ): Promise<ReferentielDefinitionType> {
    this.logger.log(`Getting referentiel definition for ${referentielId}`);

    const referentielDefinitions = await this.databaseService.db
      .select()
      .from(referentielDefinitionTable)
      .where(eq(referentielDefinitionTable.id, referentielId))
      .limit(1);

    if (!referentielDefinitions.length) {
      throw new NotFoundException(
        `Referentiel definition ${referentielId} not found`
      );
    }

    return referentielDefinitions[0];
  }

  getReferentielSpreadsheetId(referentielId: ReferentielType): string {
    if (
      referentielId === ReferentielType.TE ||
      referentielId === ReferentielType.TE_TEST
    ) {
      return this.backendConfigurationService.get('REFERENTIEL_TE_SHEET_ID');
    }
    throw new HttpException(
      `Referentiel ${referentielId} cannot be imported, missing configuration`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  getLevelFromActionId(actionId: string): number {
    const level = actionId.split('.').length;
    if (level === 1) {
      return actionId.split('_').length === 1 ? 0 : 1;
    }
    return level;
  }

  getActionTypeFromActionId(
    actionId: string,
    orderedActionTypes: ActionType[]
  ): ActionType {
    const level = this.getLevelFromActionId(actionId);
    if (level >= orderedActionTypes.length) {
      throw new HttpException(
        `Action level ${level} non consistent with referentiel action types: ${orderedActionTypes.join(
          ','
        )}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    return orderedActionTypes[level];
  }

  getActionParent(actionId: string): string | null {
    const actionIdParts = actionId.split('.');
    if (actionIdParts.length <= 1) {
      const firstPart = actionIdParts[0];
      const firstPartParts = firstPart.split('_');
      if (firstPartParts.length > 1) {
        return firstPartParts[0];
      } else {
        return null;
      }
    } else {
      return actionIdParts.slice(0, -1).join('.');
    }
  }

  parseActionsOrigine(
    referentielId: ReferentielType,
    actionId: string,
    origine: string,
    referentielDefinitions: ReferentielDefinitionType[],
    existingActionIds?: string[]
  ): CreateActionOrigineType[] {
    const createActionOrigines: {
      [actionKey: string]: CreateActionOrigineType;
    } = {};
    const lowerCaseOrigine = origine.toLowerCase();
    if (!lowerCaseOrigine.startsWith(this.ORIGIN_NEW_ACTION_PREFIX)) {
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
          !this.ACTION_ID_REGEXP.test(origineActionId)
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

        const createActionOrigine: CreateActionOrigineType = {
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

  async createReferentielTagsIfNeeded(): Promise<void> {
    const referentielTags: CreateReferentielTagType[] = [
      {
        ref: ReferentielType.CAE,
        nom: 'CAE',
        type: 'Catalogue',
      },
      {
        ref: ReferentielType.ECI,
        nom: 'ECI',
        type: 'Catalogue',
      },
      {
        ref: ImportActionDefinitionCoremeasureType.COREMEASURE,
        nom: 'EEA Coremeasure',
        type: 'EEA',
      },
    ];
    await this.databaseService.db
      .insert(referentielTagTable)
      .values(referentielTags)
      .onConflictDoNothing();
  }

  async importReferentiel(
    referentielId: ReferentielType
  ): Promise<GetReferentielResponseType> {
    const spreadsheetId = this.getReferentielSpreadsheetId(referentielId);

    const referentielDefinitions = await this.getReferentielDefinitions();
    const referentielDefinition = referentielDefinitions.find(
      (definition) => definition.id === referentielId
    );
    if (!referentielDefinition) {
      throw new NotFoundException(
        `Referentiel definition ${referentielId} not found`
      );
    }

    await this.createReferentielTagsIfNeeded();

    let changeLogVersions: ReferentielChangelogType[] = [];
    try {
      const changelogData =
        await this.sheetService.getDataFromSheet<ReferentielChangelogType>(
          spreadsheetId,
          referentielChangelogSchema,
          this.CHANGELOG_SPREADSHEET_RANGE,
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
      await this.databaseService.db
        .select({
          action_id: actionRelationTable.id,
        })
        .from(actionRelationTable)
    ).map((action) => action.action_id);

    const importActionDefinitions =
      await this.sheetService.getDataFromSheet<ImportActionDefinitionType>(
        spreadsheetId,
        importActionDefinitionSchema,
        this.REFERENTIEL_SPREADSHEET_RANGE,
        ['identifiant']
      );

    const actionDefinitions: CreateActionDefinitionType[] = [];
    const createActionOrigines: CreateActionOrigineType[] = [];
    const createPersonnalisationRegles: CreatePersonnalisationRegleType[] = [];
    const deletePersonnalisationReglesActionIds: string[] = [];
    const createActionTags: CreateActionDefinitionTagType[] = [];
    importActionDefinitions.data.forEach((action) => {
      const actionId = `${referentielId}_${action.identifiant}`;
      const alreadyExists = actionDefinitions.find(
        (action) => action.actionId === actionId
      );
      if (!alreadyExists) {
        const createActionDefinition: CreateActionDefinitionType = {
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

        const actionType = this.getActionTypeFromActionId(
          createActionDefinition.actionId,
          referentielDefinition.hierarchie
        );
        if (actionType === ActionType.SOUS_ACTION) {
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
          const coremeasureTag: CreateActionDefinitionTagType = {
            referentielId: referentielId,
            actionId: createActionDefinition.actionId,
            tagRef: ImportActionDefinitionCoremeasureType.COREMEASURE,
          };
          createActionTags.push(coremeasureTag);
        }

        if (action.desactivation) {
          const desactivationRegle: CreatePersonnalisationRegleType = {
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
          const parsedActionOrigines = this.parseActionsOrigine(
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
            const origineTag: CreateActionDefinitionTagType = {
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
    const actionRelations: CreateActionRelationType[] = [];
    actionDefinitions.forEach((action) => {
      const parent = this.getActionParent(action.actionId);
      if (parent) {
        const foundParent = actionDefinitions.find(
          (action) => action.actionId === parent
        );
        if (foundParent) {
          const actionRelation: CreateActionRelationType = {
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
        const actionRelation: CreateActionRelationType = {
          id: action.actionId,
          parent: null,
          referentiel: referentielId,
        };
        actionRelations.push(actionRelation);
      }
    });

    await this.databaseService.db.transaction(async (tx) => {
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

    return this.getReferentiel(referentielId, false, true);
  }
}
