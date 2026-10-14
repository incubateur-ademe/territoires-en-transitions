import { parseAsString, useQueryState } from 'nuqs';

export const PLAN_SECTEURS_LISTE = 'liste';

export const usePlanSecteursVue = () =>
  useQueryState('secteurs', parseAsString);
