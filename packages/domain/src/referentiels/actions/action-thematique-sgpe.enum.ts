import { z } from 'zod';
import { createEnumObject } from '../../utils';

export const actionThematiqueSgpeValues = [
  'planifier',
  'gerer_patrimoine',
  'consommer',
  'preserver_valoriser',
  'produire',
  'se_deplacer',
  'se_nourrir',
  'mobiliser',
] as const;

export const ActionThematiqueSgpeEnum = createEnumObject(
  actionThematiqueSgpeValues
);

export const actionThematiqueSgpeSchema = z.enum(actionThematiqueSgpeValues);

export type ActionThematiqueSgpe = z.infer<typeof actionThematiqueSgpeSchema>;

export const actionThematiqueSgpeLabels: Record<ActionThematiqueSgpe, string> = {
  planifier: 'Mieux planifier et piloter',
  gerer_patrimoine: 'Mieux se loger et gérer le patrimoine',
  consommer: 'Mieux consommer',
  preserver_valoriser: 'Mieux préserver et valoriser nos écosystèmes',
  produire: 'Mieux produire',
  se_deplacer: 'Mieux se déplacer',
  se_nourrir: 'Mieux se nourrir',
  mobiliser: 'Mieux mobiliser',
};
