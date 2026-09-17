import { z } from 'zod';
import { createEnumObject } from '../../utils';

export const actionTypeCalculScoreValues = [
  'valeur_cible_seuil',
  'presence_absence',
  'progression',
] as const;

export const ActionTypeCalculScoreEnum = createEnumObject(
  actionTypeCalculScoreValues
);

export const actionTypeCalculScoreSchema = z.enum(
  actionTypeCalculScoreValues
);

export type ActionTypeCalculScore = z.infer<
  typeof actionTypeCalculScoreSchema
>;
