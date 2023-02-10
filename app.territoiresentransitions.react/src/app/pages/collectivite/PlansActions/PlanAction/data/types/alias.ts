import {Database} from 'types/database.types';

export type TPlanActionAxeRow = Database['public']['Tables']['axe']['Row'];
export type TPlanActionAxeInsert =
  Database['public']['Tables']['axe']['Insert'];
export type TPlanActionAxeUpdate =
  Database['public']['Tables']['axe']['Update'];

export type TPlanActionChemin =
  Database['public']['Views']['plan_action_chemin']['Row'];

export type TPlanActionProfondeur =
  Database['public']['Views']['plan_action_profondeur']['Row'];
