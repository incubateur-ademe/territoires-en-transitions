import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq, getTableColumns } from 'drizzle-orm';
import * as _ from 'lodash';
import DatabaseService from '../../common/services/database.service';
import {
  ActionDefinitionAvecParentType,
  actionDefinitionTable,
} from '../models/action-definition.table';
import { actionRelationTable } from '../models/action-relation.table';
import { ActionType } from '../models/action-type.enum';
import { GetReferentielResponseType } from '../models/get-referentiel.response';
import { ReferentielActionType } from '../models/referentiel-action.dto';
import { referentielList, ReferentielType } from '../models/referentiel.enum';

@Injectable()
export default class ReferentielsService {
  private readonly logger = new Logger(ReferentielsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

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

  async checkReferentielExists(referentielId: ReferentielType): Promise<void> {
    if (!referentielList.includes(referentielId)) {
      throw new NotFoundException(`Referentiel ${referentielId} not found`);
    }
  }

  async getReferentiel(
    referentielId: ReferentielType,
    uniquementPourScoring?: boolean
  ): Promise<GetReferentielResponseType> {
    this.logger.log(
      `Recherche des actions pour le referentiel ${referentielId}`
    );

    await this.checkReferentielExists(referentielId);

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

    // TODO: get it from referentiel table
    let orderedActionTypes: ActionType[] = [
      ActionType.REFERENTIEL,
      ActionType.AXE,
      ActionType.SOUS_AXE,
      ActionType.ACTION,
      ActionType.SOUS_ACTION,
      ActionType.TACHE,
    ];
    if (referentielId === 'eci') {
      // Pas de sous axes pour l'ECI
      orderedActionTypes = [
        ActionType.REFERENTIEL,
        ActionType.AXE,
        ActionType.ACTION,
        ActionType.SOUS_ACTION,
        ActionType.TACHE,
      ];
    }

    const actionsTree = this.buildReferentielTree(
      actionDefinitions,
      orderedActionTypes
    );

    return {
      items_tree: actionsTree,
      ordered_item_types: orderedActionTypes,
    };
  }
}
