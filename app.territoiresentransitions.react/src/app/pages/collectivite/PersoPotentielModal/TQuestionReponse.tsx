export enum QuestionType {
  choix = 'choix',
  binaire = 'binaire',
  proportion = 'proportion',
}

type TQuestionId = string;
type TChoixId = string;
type TQuestion = {
  id: TQuestionId;
  type: QuestionType;
  description: string;
  formulation: string;
  choix?: [{id: TChoixId; label: string}];
};

export type TReponse = TChoixId | boolean | number | null;

export type TQuestionReponse = TQuestion & {
  reponse?: TReponse;
};

export type TChangeReponse = (newValue: TReponse) => void;
