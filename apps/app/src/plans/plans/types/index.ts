import { TAxeRow } from '@/app/types/alias';
import { Views } from '@tet/api';

type TPlanActionProfondeur = Views<'plan_action_profondeur'>;

export type TProfondeurPlan = TPlanActionProfondeur & {
  plan: TProfondeurAxe;
};

export type TProfondeurAxe = {
  axe: TAxeRow;
  profondeur: number;
  enfants: TProfondeurAxe[];
};
