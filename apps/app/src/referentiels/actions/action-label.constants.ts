import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';

export const ACTION_TYPE_LABELS: { [key in ActionType]: string } = {
  [ActionTypeEnum.ACTION]: 'mesure',
  [ActionTypeEnum.SOUS_ACTION]: 'sous-mesure',
  [ActionTypeEnum.TACHE]: 'tâche',
  [ActionTypeEnum.REFERENTIEL]: 'référentiel',
  [ActionTypeEnum.AXE]: 'axe',
  [ActionTypeEnum.SOUS_AXE]: 'sous-axe',
  [ActionTypeEnum.EXEMPLE]: 'exemple',
};
