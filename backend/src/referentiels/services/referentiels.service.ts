import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { asc, eq, getTableColumns, sql } from 'drizzle-orm';
import * as _ from 'lodash';
import * as semver from 'semver';
import BackendConfigurationService from '../../common/services/backend-configuration.service';
import DatabaseService from '../../common/services/database.service';
import SheetService from '../../spreadsheets/services/sheet.service';
import {
  ActionDefinitionAvecParentType,
  actionDefinitionTable,
  CreateActionDefinitionType,
  importActionDefinitionSchema,
  ImportActionDefinitionType,
} from '../models/action-definition.table';
import {
  actionRelationTable,
  CreateActionRelationType,
} from '../models/action-relation.table';
import { ActionType } from '../models/action-type.enum';
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
import { ReferentielType } from '../models/referentiel.enum';

@Injectable()
export default class ReferentielsService {
  private readonly logger = new Logger(ReferentielsService.name);

  private readonly CHANGELOG_SPREADSHEET_RANGE = 'Versions!A:Z';
  private readonly REFERENTIEL_SPREADSHEET_RANGE = 'Referentiel!A:Z';

  constructor(
    private readonly backendConfigurationService: BackendConfigurationService,
    private readonly databaseService: DatabaseService,
    private readonly sheetService: SheetService
  ) {}

  buildReferentielTree(
    actionDefinitions: ActionDefinitionAvecParentType[],
    orderedActionTypes: ActionType[]
  ): ReferentielActionType {
    const rootAction = actionDefinitions.find(
      (action) => !action.parent_action_id
    );
    if (!rootAction) {
      throw new NotFoundException(`Referentiel not found`);
    }
    const { parent_action_id, ...rootActionSansParent } = rootAction;
    const referentiel: ReferentielActionType = {
      ...rootActionSansParent,
      level: 0,
      action_type: orderedActionTypes[0],
      actions_enfant: [],
    };
    this.attacheActionsEnfant(
      referentiel,
      actionDefinitions,
      orderedActionTypes,
      referentiel.level
    );

    return referentiel;
  }

  attacheActionsEnfant(
    referentiel: ReferentielActionType,
    actionDefinitions: ActionDefinitionAvecParentType[],
    orderActionTypes: ActionType[],
    currentLevel: number
  ): void {
    const actionsEnfant = actionDefinitions.filter(
      (action) => action.parent_action_id === referentiel.action_id
    );

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
              `Total pourcentage des actions enfant de ${referentiel.action_id} doit être égal à 100`,
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          }
        }
      }

      actionsEnfant.forEach((actionEnfant) => {
        const { parent_action_id, ...actionEnfantSansParent } = actionEnfant;
        const actionEnfantDansReferentiel: ReferentielActionType = {
          ...actionEnfantSansParent,
          actions_enfant: [],
          level: levelEnfant,
          action_type: actionTypeEnfant,
        };
        if (
          _.isNil(actionEnfantDansReferentiel.points) &&
          !_.isNil(actionEnfantDansReferentiel.pourcentage) &&
          !_.isNil(referentiel.points)
        ) {
          actionEnfantDansReferentiel.points =
            (referentiel.points * actionEnfantDansReferentiel.pourcentage) /
            100;
          if (actionEnfantDansReferentiel.action_id === 'cae_3.1.2.3.1') {
            this.logger.log(
              `Calcul du score de ${actionEnfantDansReferentiel.action_id} : ${referentiel.points} * ${actionEnfantDansReferentiel.pourcentage} / 100 = ${actionEnfantDansReferentiel.points}`
            );
          }
        }
        referentiel.actions_enfant.push(actionEnfantDansReferentiel);
        this.attacheActionsEnfant(
          actionEnfantDansReferentiel,
          actionDefinitions,
          orderActionTypes,
          levelEnfant
        );
      });

      // Maintenant que la recursion est terminée, on recalcule le score du parent
      if (referentiel.actions_enfant.length > 0) {
        if (_.isNil(referentiel.points)) {
          // Only if not already computed

          referentiel.points = referentiel.actions_enfant.reduce(
            (acc, action) => acc + (action.points || 0),
            0
          );
        }
        referentiel.actions_enfant.forEach((action) => {
          if (action.points && referentiel.points) {
            action.pourcentage = (action.points / referentiel.points) * 100;
          }
        });
      }
    }
  }

  async getReferentiel(
    referentielId: ReferentielType,
    uniquementPourScoring?: boolean
  ): Promise<GetReferentielResponseType> {
    this.logger.log(
      `Recherche des actions pour le referentiel ${referentielId}`
    );

    const referentielDefinition = await this.getReferentielDefinition(
      referentielId
    );

    const colonnes = uniquementPourScoring
      ? {
          action_id: actionDefinitionTable.action_id,
          nom: actionDefinitionTable.nom,
          points: actionDefinitionTable.points,
          pourcentage: actionDefinitionTable.pourcentage,
        }
      : getTableColumns(actionDefinitionTable);
    const actionDefinitions = await this.databaseService.db
      .select({
        ...colonnes,
        parent_action_id: actionRelationTable.parent,
      })
      .from(actionDefinitionTable)
      .leftJoin(
        actionRelationTable,
        eq(actionDefinitionTable.action_id, actionRelationTable.id)
      )
      .where(
        eq(actionDefinitionTable.referentiel, referentielId as ReferentielType) // TODO: à enlever lorsque ce sera une table plutot qu'un enum
      )
      .orderBy(asc(actionDefinitionTable.action_id));
    this.logger.log(
      `${actionDefinitions.length} actions trouvees pour le referentiel ${referentielId}`
    );

    const actionsTree = this.buildReferentielTree(
      actionDefinitions,
      referentielDefinition.hierarchie
    );

    return {
      items_tree: actionsTree,
      version: referentielDefinition.version,
      ordered_item_types: referentielDefinition.hierarchie,
    };
  }

  async getReferentielDefinition(
    referentielId: ReferentielType
  ): Promise<ReferentielDefinitionType> {
    this.logger.log(
      `Recherche de la definition du referentiel ${referentielId}`
    );

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
      return this.backendConfigurationService.getBackendConfiguration()
        .REFERENTIEL_TE_SHEET_ID;
    }
    throw new HttpException(
      `Referentiel ${referentielId} cannot be imported, missing configuration`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
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

  async importReferentiel(
    referentielId: ReferentielType
  ): Promise<GetReferentielResponseType> {
    const spreadsheetId = this.getReferentielSpreadsheetId(referentielId);

    const referentielDefinition = await this.getReferentielDefinition(
      referentielId
    );

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

    const importActionDefinitions =
      await this.sheetService.getDataFromSheet<ImportActionDefinitionType>(
        spreadsheetId,
        importActionDefinitionSchema,
        this.REFERENTIEL_SPREADSHEET_RANGE,
        ['identifiant']
      );

    const actionDefinitions: CreateActionDefinitionType[] = [];
    importActionDefinitions.data.forEach((action) => {
      const actionId = `${referentielId}_${action.identifiant}`;
      const alreadyExists = actionDefinitions.find(
        (action) => action.action_id === actionId
      );
      if (!alreadyExists) {
        const createActionDefinition: CreateActionDefinitionType = {
          identifiant: action.identifiant,
          action_id: `${referentielId}_${action.identifiant}`,
          nom: action.nom || '',
          description: action.description || '',
          contexte: action.contexte || '',
          exemples: action.exemples || '',
          ressources: action.ressources || '',
          reduction_potentiel: action.reduction_potentiel || '',
          perimetre_evaluation: action.perimetre_evaluation || '',
          preuve: action.preuve || '',
          points: action.points || null,
          pourcentage: action.pourcentage || null,
          categorie: action.categorie || null,
          referentiel: referentielId,
          referentiel_id: referentielDefinition.id,
        };
        actionDefinitions.push(createActionDefinition);
      } else {
        throw new UnprocessableEntityException(
          `Action ${actionId} is duplicated in the spreadsheet`
        );
      }
    });
    // Add root action
    actionDefinitions.push({
      action_id: referentielId,
      identifiant: '',
      nom: referentielDefinition.nom,
      description: '',
      contexte: '',
      exemples: '',
      ressources: '',
      reduction_potentiel: '',
      perimetre_evaluation: '',
      preuve: '',
      referentiel: referentielId,
      referentiel_id: referentielDefinition.id,
    });

    // Sort to create parent relations in the right order
    actionDefinitions.sort((a, b) => {
      return a.action_id.localeCompare(b.action_id);
    });
    const actionRelations: CreateActionRelationType[] = [];
    actionDefinitions.forEach((action) => {
      const parent = this.getActionParent(action.action_id);
      if (parent) {
        const foundParent = actionDefinitions.find(
          (action) => action.action_id === parent
        );
        if (foundParent) {
          const actionRelation: CreateActionRelationType = {
            id: action.action_id,
            parent: parent,
            referentiel: referentielId,
          };
          actionRelations.push(actionRelation);
        } else {
          throw new UnprocessableEntityException(
            `Action parent ${parent} not found for action ${action.action_id}`
          );
        }
      } else {
        // Root action
        const actionRelation: CreateActionRelationType = {
          id: action.action_id,
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
          target: [actionDefinitionTable.action_id],
          set: {
            nom: sql.raw(`excluded.${actionDefinitionTable.nom.name}`),
            description: sql.raw(
              `excluded.${actionDefinitionTable.description.name}`
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
            reduction_potentiel: sql.raw(
              `excluded.${actionDefinitionTable.reduction_potentiel.name}`
            ),
            perimetre_evaluation: sql.raw(
              `excluded.${actionDefinitionTable.perimetre_evaluation.name}`
            ),
            preuve: sql.raw(`excluded.${actionDefinitionTable.preuve.name}`),
            points: sql.raw(`excluded.${actionDefinitionTable.points.name}`),
            pourcentage: sql.raw(
              `excluded.${actionDefinitionTable.pourcentage.name}`
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

    return this.getReferentiel(referentielId);
  }
}
