import {Database} from 'types/database.types';

export type TProfondeurPlan =
  Database['public']['Views']['plan_action_profondeur']['Row'] & {
    plan: TProfondeurAxe;
  };

export type TProfondeurAxe = {
  id: number;
  nom: string;
  profondeur: number;
  enfants: TProfondeurAxe[];
};
