import {TAxeRow, TPlanActionProfondeur} from 'types/alias';
import {FicheAction} from '../../FicheAction/data/types';

/** Pour typer la RPC plan_action utilisée pour afficher la page plan action */
export type PlanAction = {
  axe: TAxeRow;
  fiches: FicheAction[] | null;
  enfants?: PlanAction[];
};

export type FlatAxe = {
  id: number;
  nom: string;
  fiches: number[];
  ancestors: number[];
  depth: number;
};

export type PlanNode = FlatAxe & {children: PlanNode[]};

export type TProfondeurPlan = TPlanActionProfondeur & {
  plan: TProfondeurAxe;
};

export type TProfondeurAxe = {
  axe: TAxeRow;
  profondeur: number;
  enfants: TProfondeurAxe[];
};
