'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PersonnalisationThematique } from '@tet/domain/collectivites';
import { usePersonnalisationQuestionsReponses } from './data/use-personnalisation-questions-reponses';
import { usePersonnalisationFilters } from './filters/personnalisation-filters-context';
import { PersonnalisationQuestionsList } from './personnalisation-questions.list';

type Props = {
  thematique: PersonnalisationThematique;
};

export function PersonnalisationThematiqueQuestionsList({ thematique }: Props) {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const canEdit = hasCollectivitePermission('referentiels.mutate');
  const { filters } = usePersonnalisationFilters();

  const questionReponses = usePersonnalisationQuestionsReponses(
    collectiviteId,
    {
      ...filters,
      thematiqueIds: [thematique.id],
    }
  );

  return (
    <PersonnalisationQuestionsList
      canEdit={canEdit}
      questionReponses={questionReponses}
    />
  );
}
