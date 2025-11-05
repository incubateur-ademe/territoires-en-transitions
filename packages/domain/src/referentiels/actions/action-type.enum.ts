import z from 'zod';

export enum ActionTypeEnum {
  REFERENTIEL = 'referentiel',
  AXE = 'axe',
  SOUS_AXE = 'sous-axe',
  ACTION = 'action',
  SOUS_ACTION = 'sous-action',
  TACHE = 'tache',
  EXEMPLE = 'exemple',
}

export const orderedActionType = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
] as const;

export const actionTypeSchema = z.enum(orderedActionType);
export type ActionType = z.infer<typeof actionTypeSchema>;

export const actionTypeIncludingExempleSchema = z.enum([
  ...orderedActionType,
  ActionTypeEnum.EXEMPLE,
]);
export type ActionTypeIncludingExemple = z.infer<
  typeof actionTypeIncludingExempleSchema
>;
