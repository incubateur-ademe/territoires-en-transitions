import {Database} from 'types/database.types';
import {TPlanActionAxeRow} from './alias';

export type TProfondeurPlan =
  Database['public']['Views']['plan_action_profondeur']['Row'] & {
    plan: TProfondeurAxe;
  };

export type TProfondeurAxe = {
  axe: TPlanActionAxeRow;
  profondeur: number;
  enfants: TProfondeurAxe[];
};
