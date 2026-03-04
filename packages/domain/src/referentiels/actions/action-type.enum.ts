import z from 'zod';

export const ActionTypeEnum = {
  REFERENTIEL: 'referentiel',
  AXE: 'axe',
  SOUS_AXE: 'sous-axe',
  ACTION: 'action',
  SOUS_ACTION: 'sous-action',
  TACHE: 'tache',
  EXEMPLE: 'exemple',
} as const;

export const orderedActionType = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
  ActionTypeEnum.EXEMPLE,
] as const;

export const actionTypeSchema = z.enum(orderedActionType);
export type ActionType = z.infer<typeof actionTypeSchema>;
