import { createEnumObject } from '@/backend/utils/enum.utils';

export const IndicateurValeurTypes = ['resultat', 'objectif'] as const;

export const IndicateurValeurEnum = createEnumObject(IndicateurValeurTypes);

export type IndicateurValeurType =
  (typeof IndicateurValeurEnum)[keyof typeof IndicateurValeurEnum];

export const INDICATEUR_VALEUR_TYPE_LABEL: Record<
  IndicateurValeurType,
  string
> = {
  objectif: 'Objectifs',
  resultat: 'Résultats',
};
