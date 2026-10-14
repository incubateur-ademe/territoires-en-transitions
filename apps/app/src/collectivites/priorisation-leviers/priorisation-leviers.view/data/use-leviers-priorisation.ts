'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useMemo } from 'react';
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

  const pertinences = pertinencesQuery.data;
  const mobilisation = mobilisationQuery.data;
  const trajectoire = trajectoireQuery.data;
  const potentiels = useMemo(
    () =>
      trajectoire ? toPotentielsReduction(trajectoire) : UNAVAILABLE_POTENTIELS,
    [trajectoire]
  );
  const leviers = useMemo(() => {
    if (pertinences === undefined || mobilisation === undefined) {
      return undefined;
    }
    return toLeviersPriorisation({
      pertinences: pertinences.pertinences,
      mobilisation,
      potentiels,
    });
  }, [pertinences, mobilisation, potentiels]);

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
    trajectoire !== undefined || trajectoireQuery.isLoadingError;
  const isStillLoading =
    leviers === undefined ||
    mobilisation === undefined ||
    !isTrajectoireSettled;
  if (isStillLoading) {
    return { status: 'loading' };
  }

  return {
    status: 'ready',
    leviers,
    hasMobilisation: hasMobilisation(mobilisation),
    potentiels,
  };
};
