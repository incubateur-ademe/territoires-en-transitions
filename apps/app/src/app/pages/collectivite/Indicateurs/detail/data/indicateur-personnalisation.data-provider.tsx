'use client';

import { useListPersonnalisationQuestionsReponses } from '@/app/collectivites/personnalisations/data/use-list-personnalisation-questions-reponses';
import { useCollectiviteId } from '@tet/api/collectivites';
import type { PropsWithChildren } from 'react';
import { IndicateurPersonnalisationProvider } from '../context/indicateur-personnalisation.context';

const PERSONNALISATION_QUESTION_ID = 'potentiel_eolien_ou_hydro';

const useListQuestionsReponses = () => {
  const collectiviteId = useCollectiviteId();
  return useListPersonnalisationQuestionsReponses(collectiviteId, {
    questionIds: [PERSONNALISATION_QUESTION_ID],
  });
};

const PERSONNALISATION_VALUE = { useListQuestionsReponses };

export const IndicateurPersonnalisationDataProvider = ({
  children,
}: PropsWithChildren) => (
  <IndicateurPersonnalisationProvider value={PERSONNALISATION_VALUE}>
    {children}
  </IndicateurPersonnalisationProvider>
);
