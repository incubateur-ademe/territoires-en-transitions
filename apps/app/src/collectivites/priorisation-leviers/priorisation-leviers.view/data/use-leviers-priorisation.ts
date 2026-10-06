'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { hasMobilisation } from './to-levier-cards';
import {
  LevierPriorisation,
  PotentielsReduction,
  toLeviersPriorisation,
  toPotentielsReduction,
} from './to-leviers-priorisation';
import { toPertinencesListInput } from './to-pertinences-list-input';

export type LeviersPriorisationQuery =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | {
      status: 'ready';
      leviers: LevierPriorisation[];
      hasMobilisation: boolean;
      potentiels: PotentielsReduction;
    };

const UNAVAILABLE_POTENTIELS: PotentielsReduction = {
  status: 'indisponible',
};

export const useLeviersPriorisation = (
  collectiviteId: number
): LeviersPriorisationQuery => {
  const trpc = useTRPC();

  const pertinencesQuery = useQuery(
    trpc.collectivites.pertinenceLeviers.list.queryOptions(
      toPertinencesListInput(collectiviteId)
    )
  );
  const mobilisationQuery = useQuery(
    trpc.collectivites.analysis.getMobilisation.queryOptions({
      collectiviteId,
      enjeu: 'ges',
    })
  );
  const trajectoireQuery = useQuery(
    trpc.indicateurs.trajectoires.leviers.getData.queryOptions(
      { collectiviteId },
      { retry: false }
    )
  );

  const retryFailedQueries = (): void => {
    if (pertinencesQuery.isLoadingError) {
      void pertinencesQuery.refetch();
    }
    if (mobilisationQuery.isLoadingError) {
      void mobilisationQuery.refetch();
    }
  };

  const hasLoadingError =
    pertinencesQuery.isLoadingError || mobilisationQuery.isLoadingError;
  if (hasLoadingError) {
    return { status: 'error', retry: retryFailedQueries };
  }

  const isTrajectoireSettled =
    trajectoireQuery.data !== undefined || trajectoireQuery.isLoadingError;
  const pertinences = pertinencesQuery.data;
  const mobilisation = mobilisationQuery.data;
  const isStillLoading =
    pertinences === undefined ||
    mobilisation === undefined ||
    !isTrajectoireSettled;
  if (isStillLoading) {
    return { status: 'loading' };
  }

  const potentiels = trajectoireQuery.data
    ? toPotentielsReduction(trajectoireQuery.data)
    : UNAVAILABLE_POTENTIELS;
  return {
    status: 'ready',
    leviers: toLeviersPriorisation({
      pertinences: pertinences.pertinences,
      mobilisation,
      potentiels,
    }),
    hasMobilisation: hasMobilisation(mobilisation),
    potentiels,
  };
};
