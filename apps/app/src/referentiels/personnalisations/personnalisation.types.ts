/**
 * Typage des questions/réponses pour la personnalisation des référentiels
 */

import {
  PersonnalisationReponseValue,
  QuestionWithChoices,
} from '@tet/domain/collectivites';

/** La combinaison d'une question et de sa réponse */
export type TQuestionReponse = QuestionWithChoices & {
  reponse?: PersonnalisationReponseValue;
  justification?: string | null;
};

export type TChangeReponse = (
  question: QuestionWithChoices,
  reponse: PersonnalisationReponseValue
) => void;
