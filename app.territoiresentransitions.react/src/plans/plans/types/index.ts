import { TAxeRow, TFlatAxe, TPlanActionProfondeur } from '@/app/types/alias';
import { PlanType as PlanTypeBackend } from '@/backend/plans/plans/plans.schema';

export type PlanType = TAxeRow & {
  type?: PlanTypeBackend;
};

export type FlatAxe = Omit<TFlatAxe, 'fiches' | 'ancestors'> & {
  fiches: number[] | null;
  ancestors: number[];
};

export type TProfondeurPlan = TPlanActionProfondeur & {
  plan: TProfondeurAxe;
};

export type TProfondeurAxe = {
  axe: TAxeRow;
  profondeur: number;
  enfants: TProfondeurAxe[];
};
