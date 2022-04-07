import {TQuestionRead} from '../question_read';
import {TReponse} from '../reponse_read';

export type TQuestionReponse = TQuestionRead & {
  reponse?: TReponse;
};

// données pour l'appel à la méthode save du endpoint
export type TQuestionReponseWrite = {
  collectivite_id: number;
  question: TQuestionRead;
  reponse: TReponse;
};

// données pour l'appel RPC
export type TReponseWrite = {
  collectivite_id: number;
  question_id: string;
  reponse: TReponse;
};

export type TChangeReponse = (
  question: TQuestionRead,
  reponse: TReponse
) => void;
