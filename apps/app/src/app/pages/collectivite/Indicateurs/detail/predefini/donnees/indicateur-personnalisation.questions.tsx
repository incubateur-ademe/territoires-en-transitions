'use client';

import { PersonnalisationQuestionsList } from '@/app/collectivites/personnalisations/personnalisation-questions.list';
import { VisibleWhen } from '@tet/ui';
import { useIndicateurPersonnalisation } from '../context/indicateur-personnalisation.context';

export const INDICATEUR_PERSONNALISATION_IDENTIFIANT = 'cae_25.b';

export const IndicateurPersonnalisationQuestions = ({
  isDrom,
  canEdit,
}: {
  isDrom: boolean;
  canEdit: boolean;
}) => {
  const { useListQuestionsReponses } = useIndicateurPersonnalisation();
  const questionReponses = useListQuestionsReponses();

  return (
    <VisibleWhen condition={!isDrom && questionReponses.length > 0}>
      <PersonnalisationQuestionsList
        questionReponses={questionReponses}
        canEdit={canEdit}
      />
    </VisibleWhen>
  );
};
