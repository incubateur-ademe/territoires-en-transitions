import {TQuestionRead, TQuestionId} from '../question_read';
import {TReponse} from '../reponse_read';

export type TQuestionReponse = TQuestionRead & {
  reponse?: TReponse;
};

export type TReponseWrite = {
  collectivite_id: number;
  question_id: TQuestionId;
  reponse: TReponse;
};

export type TChangeReponse = (question_id: string, reponse: TReponse) => void;
