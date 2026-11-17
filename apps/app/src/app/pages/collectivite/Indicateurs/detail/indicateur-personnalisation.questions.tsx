'use client';

import { PersonnalisationQuestionsList } from '@/app/collectivites/personnalisations/personnalisation-questions.list';
import { useListPersonnalisationQuestionsReponses } from '@/app/collectivites/personnalisations/data/use-list-personnalisation-questions-reponses';
import { useCollectiviteId } from '@tet/api/collectivites';
import { VisibleWhen } from '@tet/ui';

export const INDICATEUR_PERSONNALISATION_IDENTIFIANT = 'cae_25.b';

const PERSONNALISATION_QUESTION_ID = 'potentiel_eolien_ou_hydro';

export const IndicateurPersonnalisationQuestions = ({
  isDrom,
  canEdit,
}: {
  isDrom: boolean;
  canEdit: boolean;
}) => {
  const collectiviteId = useCollectiviteId();
  const questionReponses = useListPersonnalisationQuestionsReponses(
    collectiviteId,
    { questionIds: [PERSONNALISATION_QUESTION_ID] }
  );

  return (
    <VisibleWhen condition={!isDrom && questionReponses.length > 0}>
      <PersonnalisationQuestionsList
        questionReponses={questionReponses}
        canEdit={canEdit}
      />
    </VisibleWhen>
  );
};
