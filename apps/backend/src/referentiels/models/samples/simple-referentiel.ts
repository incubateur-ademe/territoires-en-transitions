import { ActionDefinitionEssential, TreeNode } from '../action-definition.dto';
import { ActionTypeEnum } from '../action-type.enum';

export const simpleReferentiel: TreeNode<ActionDefinitionEssential> = {
  actionId: 'eci',
  points: 100,
  level: 0,
  actionType: ActionTypeEnum.REFERENTIEL,
  actionsEnfant: [
    {
      actionId: 'eci_1',
      points: 30,
      level: 1,
      actionType: ActionTypeEnum.ACTION,
      actionsEnfant: [
        {
          actionId: 'eci_1.1',
          points: 10,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [],
        },
        {
          actionId: 'eci_1.2',
          points: 20,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [],
        },
      ],
    },
    {
      actionId: 'eci_2',
      points: 70,
      level: 1,
      actionType: ActionTypeEnum.ACTION,
      actionsEnfant: [
        {
          actionId: 'eci_2.0',
          points: 0,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [],
        },
        {
          actionId: 'eci_2.1',
          points: 65,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [],
        },
        {
          actionId: 'eci_2.2',
          points: 5,
          level: 2,
          actionType: ActionTypeEnum.SOUS_ACTION,
          actionsEnfant: [],
        },
      ],
    },
  ],
};
