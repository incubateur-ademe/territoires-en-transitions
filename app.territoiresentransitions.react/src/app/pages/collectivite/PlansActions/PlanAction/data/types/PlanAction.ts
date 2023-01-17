import {TFicheAction} from '../../../FicheAction/data/types/alias';

export type TPlanAction = {
  nom: string;
  id: number;
  fiches: TFicheAction[] | null;
  enfants?: TPlanAction[];
};
