import type { QuestionWithChoices } from './question-with-choices.schema';
import type { PersonnalisationReponse } from './reponse.schema';

/** Question de personnalisation avec la réponse collectivité associée */
export type QuestionReponse = {
  question: QuestionWithChoices;
  reponse: PersonnalisationReponse | null;
};
