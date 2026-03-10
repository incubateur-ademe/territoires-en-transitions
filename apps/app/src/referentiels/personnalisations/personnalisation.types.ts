/**
 * Typage des questions/réponses pour la personnalisation des référentiels
 */

import { Enums } from '@tet/api';

/** Question */
export type TQuestionRead = {
  id: string;
  thematique_id: string;
  thematique_nom: string;
  type: TQuestionType;
  description: string;
  formulation: string;
  choix?: TListeChoix;
};

export type TQuestionType = Enums<'question_type'>;
export type TListeChoix = { id: string; label: string }[];

/** Réponse */
export type TReponse = string | boolean | number | null;

export type TReponseRead = {
  question_id: string;
  collectivite_id: number;
  justification: string | null;
  reponse: {
    type: TQuestionType;
    reponse: TReponse;
  };
};

/** La combinaison d'une question et de sa réponse */
export type TQuestionReponse = TQuestionRead & {
  reponse?: TReponse;
  justification?: string | null;
};

export type TChangeReponse = (
  question: TQuestionRead,
  reponse: TReponse
) => void;
