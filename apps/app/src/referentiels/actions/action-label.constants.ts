import { appLabels } from '@/app/labels/catalog';
import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';

export const ACTION_TYPE_LABELS: { [key in ActionType]: string } = {
  [ActionTypeEnum.ACTION]: appLabels.actionTypeAction,
  [ActionTypeEnum.SOUS_ACTION]: appLabels.actionTypeSousAction,
  [ActionTypeEnum.TACHE]: appLabels.actionTypeTache,
  [ActionTypeEnum.REFERENTIEL]: appLabels.actionTypeReferentiel,
  [ActionTypeEnum.AXE]: appLabels.actionTypeAxe,
  [ActionTypeEnum.SOUS_AXE]: appLabels.actionTypeSousAxe,
  [ActionTypeEnum.EXEMPLE]: appLabels.actionTypeExemple,
};
