import {
  TAxeRow,
  TFlatAxe,
  TPlanActionProfondeur,
  TPlanType,
} from '@/app/types/alias';

export type PlanType = TAxeRow & {
  type?: TPlanType;
};

export type FlatAxe = Omit<TFlatAxe, 'fiches' | 'ancestors'> & {
  fiches: number[] | null;
  ancestors: number[];
};

export type PlanNode = Omit<FlatAxe, 'ancestors' | 'sort_path'> & {
  parent: number | null;
};

export type TProfondeurPlan = TPlanActionProfondeur & {
  plan: TProfondeurAxe;
};

export type TProfondeurAxe = {
  axe: TAxeRow;
  profondeur: number;
  enfants: TProfondeurAxe[];
};
