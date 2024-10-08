import { pgEnum } from 'drizzle-orm/pg-core';

export enum ActionType {
  REFERENTIEL = 'referentiel',
  AXE = 'axe',
  SOUS_AXE = 'sous-axe',
  ACTION = 'action',
  SOUS_ACTION = 'sous-action',
  TACHE = 'tache',
  EXEMPLE = 'exemple',
}
export const orderedActionType = [
  ActionType.REFERENTIEL,
  ActionType.AXE,
  ActionType.SOUS_AXE,
  ActionType.ACTION,
  ActionType.SOUS_ACTION,
  ActionType.TACHE,
] as const;
export const actionTypeEnum = pgEnum('action_type', orderedActionType);
