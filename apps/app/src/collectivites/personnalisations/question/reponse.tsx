import { FC } from 'react';
import { QuestionReponseProps } from './question-reponse-props.types';
import { ReponseBinaire } from './reponse-binaire';
import { ReponseChoix } from './reponse-choix';
import { ReponseProportion } from './reponse-proportion';

/** Correspondances entre un type de question et son composant de réponse */
export const reponseParType: Record<string, FC<QuestionReponseProps>> = {
  choix: ReponseChoix,
  binaire: ReponseBinaire,
  proportion: ReponseProportion,
};
