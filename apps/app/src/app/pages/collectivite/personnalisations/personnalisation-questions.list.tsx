'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PersonnalisationThematique } from '@tet/domain/collectivites';
import { usePersonnalisationQuestionsReponses } from './data/use-personnalisation-questions-reponses';
import { useSaveReponse } from './data/use-save-reponse';
import { usePersonnalisationFilters } from './filters/personnalisation-filters-context';
import { QuestionReponse } from './question/question-reponse';

type Props = {
  thematique: PersonnalisationThematique;
};

export function PersonnalisationQuestionsList({ thematique }: Props) {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const canEdit = hasCollectivitePermission('referentiels.mutate');
  const { filters } = usePersonnalisationFilters();

  const qrList = usePersonnalisationQuestionsReponses(collectiviteId, {
    ...filters,
    thematiqueIds: [thematique.id],
  });
  const handleChange = useSaveReponse();

  const firstProportionIndex = qrList.findIndex(
    ({ question }) => question.type === 'proportion'
  );

  return (
    <div className="flex flex-col pt-2 pb-4 px-4 gap-4">
      {qrList.map(({ question, reponse }, index) => (
        <QuestionReponse
          key={question.id}
          question={question}
          reponse={reponse}
          canEdit={canEdit}
          onChange={(reponse) => handleChange(question, reponse)}
          hasProportionDescription={index === firstProportionIndex}
        />
      ))}
    </div>
  );
}
