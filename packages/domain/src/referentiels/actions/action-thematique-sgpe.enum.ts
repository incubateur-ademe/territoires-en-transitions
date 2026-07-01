import { z } from 'zod';
import { createEnumObject } from '../../utils';

export const actionThematiqueSgpeValues = [
  'planifier',
  'piloter_cooperer',
  'gerer_patrimoine',
  'consommer',
  'preserver_valoriser',
  'produire',
  'se_deplacer',
  'se_loger',
  'se_nourrir',
] as const;

export const ActionThematiqueSgpeEnum = createEnumObject(
  actionThematiqueSgpeValues
);

export const actionThematiqueSgpeSchema = z.enum(actionThematiqueSgpeValues);

export type ActionThematiqueSgpe = z.infer<typeof actionThematiqueSgpeSchema>;

export const actionThematiqueSgpeLabels: Record<ActionThematiqueSgpe, string> =
  {
    planifier: 'Mieux planifier',
    piloter_cooperer: 'Mieux piloter et coopérer',
    gerer_patrimoine: 'Mieux gérer le patrimoine du territoire',
    consommer: 'Mieux consommer',
    preserver_valoriser: 'Mieux préserver et valoriser nos écosystèmes',
    produire: 'Mieux produire',
    se_deplacer: 'Mieux se déplacer',
    se_loger: 'Mieux se loger',
    se_nourrir: 'Mieux se nourrir',
  };
