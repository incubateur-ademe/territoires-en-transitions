import { Views } from '@/api';
import { TAxeRow } from '@/app/types/alias';

type TPlanActionProfondeur = Views<'plan_action_profondeur'>;

export type TProfondeurPlan = TPlanActionProfondeur & {
  plan: TProfondeurAxe;
};

export type TProfondeurAxe = {
  axe: TAxeRow;
  profondeur: number;
  enfants: TProfondeurAxe[];
};
