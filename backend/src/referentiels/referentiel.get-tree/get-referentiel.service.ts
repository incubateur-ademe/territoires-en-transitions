import { DatabaseService } from '@/backend/utils';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, getTableColumns, sql } from 'drizzle-orm';
import * as _ from 'lodash';
import { actionOrigineTable } from '../correlated-actions/action-origine.table';
import { CorrelatedActionsFields } from '../correlated-actions/correlated-actions.dto';
import { GetActionOrigineDtoSchema } from '../correlated-actions/get-action-origine.dto';
import { GetReferentielResponseType } from '../get-referentiel/get-referentiel.response';
import { ActionTypeIncludingExemple } from '../index-domain';
import { actionDefinitionTagTable } from '../models/action-definition-tag.table';
import {
  ActionDefinitionEssential,
  TreeNode,
} from '../models/action-definition.dto';
import {
  ActionDefinition,
  actionDefinitionTable,
} from '../models/action-definition.table';
import { actionRelationTable } from '../models/action-relation.table';
import {
  ReferentielDefinition,
  referentielDefinitionTable,
} from '../models/referentiel-definition.table';
import { ReferentielId } from '../models/referentiel-id.enum';

export type ActionDefinitionAvecParent = Pick<
  ActionDefinition,
  'actionId' | 'points'
> &
  Partial<ActionDefinition> & {
    parentActionId: string | null;
  };

@Injectable()
export default class ReferentielsService {
  private readonly logger = new Logger(ReferentielsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private async getActionsOrigine(
    referentielId: ReferentielId
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
        eq(actionOrigineTable.referentielId, referentielId as ReferentielId)
      )
      .orderBy(asc(actionOrigineTable.actionId));
  }

  private getActionDefinitionTags() {
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

  private getActionDefinitionsWithParent(
    referentielId: ReferentielId,
    referentielVersion: string,
    { withSelectColumns }: { withSelectColumns: 'essential' | 'all' }
  ) {
    const tagsSubQuery = this.getActionDefinitionTags();

    const selectColumns =
      withSelectColumns === 'essential'
        ? {
            actionId: actionDefinitionTable.actionId,
            identifiant: actionDefinitionTable.identifiant,
            nom: actionDefinitionTable.nom,
            points: actionDefinitionTable.points,
            categorie: actionDefinitionTable.categorie,
            pourcentage: actionDefinitionTable.pourcentage,
          }
        : getTableColumns(actionDefinitionTable);

    return this.databaseService.db
      .select({
        ...selectColumns,
        parentActionId: actionRelationTable.parent,
        tags: tagsSubQuery.tags,
      })
      .from(actionDefinitionTable)
      .leftJoin(
        actionRelationTable,
        eq(actionDefinitionTable.actionId, actionRelationTable.id)
      )
      .leftJoin(
        tagsSubQuery,
        and(
          eq(actionDefinitionTable.actionId, tagsSubQuery.actionId),
          eq(actionDefinitionTable.referentielId, tagsSubQuery.referentielId)
        )
      )
      .where(
        and(
          eq(actionDefinitionTable.referentielId, referentielId),
          eq(actionDefinitionTable.referentielVersion, referentielVersion)
        )
      )
      .orderBy(asc(actionDefinitionTable.actionId));
  }

  async getReferentielTree(
    referentielId: ReferentielId,
    onlyForScoring?: boolean,
    getActionsOrigine?: boolean
  ): Promise<GetReferentielResponseType> {
    this.logger.log(`Get referentiel ${referentielId}`);

    const referentielDefinition = await this.getReferentielDefinition(
      referentielId
    );

    const actionDefinitions = await this.getActionDefinitionsWithParent(
      referentielId,
      referentielDefinition.version,
      { withSelectColumns: onlyForScoring ? 'essential' : 'all' }
    );

    this.logger.log(
      `${actionDefinitions.length} actions trouvees pour le referentiel ${referentielId}`
    );

    const actionOrigines = getActionsOrigine
      ? await this.getActionsOrigine(referentielId)
      : null;

    const actionsTree = buildReferentielTree(
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

  async getReferentielDefinitions(): Promise<ReferentielDefinition[]> {
    this.logger.log(`Getting referentiel definitions`);

    const referentielDefinitions = await this.databaseService.db
      .select()
      .from(referentielDefinitionTable);

    return referentielDefinitions;
  }

  async getReferentielDefinition(
    referentielId: ReferentielId
  ): Promise<ReferentielDefinition> {
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
}

export function buildReferentielTree(
  actionDefinitions: ActionDefinitionAvecParent[],
  orderedActionTypes: ActionTypeIncludingExemple[],
  actionOrigines?: GetActionOrigineDtoSchema[] | null
) {
  const rootAction = actionDefinitions.find((action) => !action.parentActionId);
  if (!rootAction) {
    throw new NotFoundException(`Referentiel not found`);
  }

  const { parentActionId, ...rootActionSansParent } = rootAction;
  const referentiel: TreeNode<ActionDefinitionEssential> = {
    ...rootActionSansParent,
    level: 0,
    actionType: orderedActionTypes[0],
    actionsEnfant: [],
    tags: [],
  };

  attacheActionsEnfant(
    referentiel,
    actionDefinitions,
    orderedActionTypes,
    referentiel.level,
    actionOrigines
  );

  return referentiel;
}

function attacheActionsEnfant(
  action: TreeNode<
    Partial<ActionDefinition> &
      ActionDefinitionEssential &
      CorrelatedActionsFields
  >,
  actionDefinitions: ActionDefinitionAvecParent[],
  orderActionTypes: ActionTypeIncludingExemple[],
  currentLevel: number,
  actionOrigines?: GetActionOrigineDtoSchema[] | null
): void {
  const actionsEnfant = actionDefinitions.filter(
    (action) => action.parentActionId === action.actionId
  );

  if (!action.tags) {
    action.tags = [];
  }
  // Ajoute la catégorie comme tag
  if (action.categorie) {
    action.tags.push(action.categorie);
  }

  if (actionOrigines) {
    const associatedActionOrigines = actionOrigines.filter(
      (origine) => origine.actionId === action.actionId
    );
    action.actionsOrigine = associatedActionOrigines.map((origine) => ({
      referentielId: origine.origineReferentielId,
      actionId: origine.origineActionId,
      ponderation: origine.ponderation,
      nom: origine.origineActionNom || null,
    }));
    action.referentielsOrigine = [
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
      const hasPourcentage = actionsEnfant.some((action) => action.pourcentage);
      if (hasPourcentage) {
        const totalPourcentage = actionsEnfant.reduce(
          (acc, action) => acc + (action.pourcentage || 0),
          0
        );
        if (totalPourcentage !== 100) {
          throw new HttpException(
            `Total pourcentage des actions enfant de ${action.actionId} doit être égal à 100`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }
    }

    actionsEnfant.forEach((actionEnfant) => {
      const { parentActionId, ...actionEnfantSansParent } = actionEnfant;
      const actionEnfantDansReferentiel = {
        ...actionEnfantSansParent,
        actionsEnfant: [],
        level: levelEnfant,
        actionType: actionTypeEnfant,
      };
      if (
        _.isNil(actionEnfantDansReferentiel.points) &&
        !_.isNil(actionEnfantDansReferentiel.pourcentage) &&
        !_.isNil(action.points)
      ) {
        actionEnfantDansReferentiel.points =
          (action.points * actionEnfantDansReferentiel.pourcentage) / 100;
      }
      action.actionsEnfant.push(actionEnfantDansReferentiel);

      attacheActionsEnfant(
        actionEnfantDansReferentiel,
        actionDefinitions,
        orderActionTypes,
        levelEnfant,
        actionOrigines
      );
    });

    // Maintenant que la recursion est terminée, on recalcule le score du parent et on met à jour le referentiel origine
    if (action.actionsEnfant.length > 0) {
      if (_.isNil(action.points)) {
        // Only if not already computed

        action.points = action.actionsEnfant.reduce(
          (acc, action) => acc + (action.points || 0),
          0
        );
      }
      action.actionsEnfant.forEach((action) => {
        if (action.points && action.points) {
          action.pourcentage = (action.points / action.points) * 100;
        }
      });

      // We update the origine referentiels too
      if (actionOrigines) {
        action.referentielsOrigine = [
          ...new Set(
            action.actionsEnfant
              .map((actionEnfant) => actionEnfant.referentielsOrigine || [])
              .flat()
              .concat(action.referentielsOrigine || [])
          ).values(),
        ];
      }
    }
  }
}
