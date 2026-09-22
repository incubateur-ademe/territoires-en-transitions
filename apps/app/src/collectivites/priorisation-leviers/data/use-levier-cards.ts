'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { hasMobilisation, LevierCard, toLevierCards } from '../to-levier-cards';

export type LevierCardsQuery =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; cards: LevierCard[]; hasMobilisation: boolean };

export const useLevierCards = (collectiviteId: number): LevierCardsQuery => {
  const trpc = useTRPC();

  const pertinencesQuery = useQuery(
    trpc.collectivites.pertinenceLeviers.list.queryOptions({
      collectiviteId,
      enjeu: 'ges',
    })
  );
  const mobilisationQuery = useQuery(
    trpc.collectivites.analysis.getMobilisation.queryOptions({
      collectiviteId,
      enjeu: 'ges',
    })
  );

  const retryFailedQueries = (): void => {
    if (pertinencesQuery.isLoadingError) {
      void pertinencesQuery.refetch();
    }
    if (mobilisationQuery.isLoadingError) {
      void mobilisationQuery.refetch();
    }
  };

  if (pertinencesQuery.data && mobilisationQuery.data) {
    return {
      status: 'ready',
      cards: toLevierCards({
        pertinences: pertinencesQuery.data.pertinences,
        mobilisation: mobilisationQuery.data,
      }),
      hasMobilisation: hasMobilisation(mobilisationQuery.data),
    };
  }
  if (pertinencesQuery.isLoadingError || mobilisationQuery.isLoadingError) {
    return { status: 'error', retry: retryFailedQueries };
  }
  return { status: 'loading' };
};
