import {QuestionType, TChoixId, TQuestionId} from '../question_read';

export type TReponse = TChoixId | boolean | number | null;

export type ReponseRead = {
  question_id: TQuestionId;
  collectivite_id: number;
  reponse: {
    type: QuestionType;
    reponse: TReponse;
  };
};
