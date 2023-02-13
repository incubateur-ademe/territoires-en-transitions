import {TFicheAction} from '../../../FicheAction/data/types/alias';
import {TPlanActionAxeRow} from './alias';

/** Pour typer la RPC plan_action utilisée pour afficher la page plan action */
export type TPlanAction = {
  axe: TPlanActionAxeRow;
  fiches: TFicheAction[] | null;
  enfants?: TPlanAction[];
};
