export type TQuestionRead = {
  id: TQuestionId;
  thematique_id: string;
  thematique_nom: string;
  type: QuestionType;
  description: string;
  formulation: string;
  choix?: [{id: TChoixId; label: string}];
};

export enum QuestionType {
  choix = 'choix',
  binaire = 'binaire',
  proportion = 'proportion',
}

export type TQuestionId = string;
export type TChoixId = string;
