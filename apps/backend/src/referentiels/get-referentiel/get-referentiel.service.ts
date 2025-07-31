import { ActionTypeIncludingExemple } from '@/backend/referentiels/models/action-type.enum';
import { DatabaseService } from '@/backend/utils';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
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
import { actionDefinitionTagTable } from '../models/action-definition-tag.table';
import {
  ActionDefinitionEssential,
  TreeNode,
} from '../models/action-definition.dto';
import {
  ActionDefinition,
  ActionDefinitionMinimalWithTypeAndLevel,
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

/**
 * Représentation du referentiel sous forme de liste, map ou hierarchie
 */
export interface ReferentielResponse {
  version: string;
  orderedItemTypes: Array<ActionTypeIncludingExemple>;
  itemsTree: TreeNode<ActionDefinitionEssential & CorrelatedActionsFields>;
  itemsList?: Array<ActionDefinitionMinimalWithTypeAndLevel>;
  itemsMap?: Record<string, ActionDefinitionMinimalWithTypeAndLevel>;
}

@Injectable()
export class GetReferentielService {
  private readonly logger = new Logger(GetReferentielService.name);

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

  getActionDefinitionsWithParent(
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
  ): Promise<ReferentielResponse> {
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
      .select({
        ...getTableColumns(referentielDefinitionTable),
        createdAt: getISOFormatDateQuery(referentielDefinitionTable.createdAt),
        modifiedAt: getISOFormatDateQuery(
          referentielDefinitionTable.modifiedAt
        ),
      })
      .from(referentielDefinitionTable);

    return referentielDefinitions;
  }

  async getReferentielDefinition(
    referentielId: ReferentielId
  ): Promise<ReferentielDefinition> {
    this.logger.log(`Getting referentiel definition for ${referentielId}`);

    const referentielDefinitions = await this.databaseService.db
      .select({
        ...getTableColumns(referentielDefinitionTable),
        createdAt: getISOFormatDateQuery(referentielDefinitionTable.createdAt),
        modifiedAt: getISOFormatDateQuery(
          referentielDefinitionTable.modifiedAt
        ),
      })
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
  const referentiel = {
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
  referentiel: TreeNode<
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
      const hasPourcentage = actionsEnfant.some((action) => action.pourcentage);
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
      const actionEnfantDansReferentiel = {
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
          (referentiel.points * actionEnfantDansReferentiel.pourcentage) / 100;
      }
      referentiel.actionsEnfant.push(actionEnfantDansReferentiel);

      attacheActionsEnfant(
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
