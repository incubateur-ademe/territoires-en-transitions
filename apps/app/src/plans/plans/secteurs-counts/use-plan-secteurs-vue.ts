import { PLAN_SECTEURS_LISTE, PLAN_SECTEURS_PARAMETER } from '@/app/app/paths';
import { parseAsString, useQueryState } from 'nuqs';

export { PLAN_SECTEURS_LISTE };

export const usePlanSecteursVue = () =>
  useQueryState(PLAN_SECTEURS_PARAMETER, parseAsString);
