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
import {
  PriorisationAccess,
  toPriorisationAccess,
  toTrajectoireState,
} from './to-priorisation-access';

export type LeviersPriorisationQuery =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | {
      status: 'ready';
      leviers: LevierPriorisation[];
      access: PriorisationAccess;
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
  const trajectoireErrorKey = trajectoireQuery.error?.data?.errorKey;
  const trajectoireState = toTrajectoireState({
    hasTrajectoire: trajectoire !== undefined,
    isLoadingError: trajectoireQuery.isLoadingError,
    isTrajectoireNotComputed:
      trajectoireErrorKey === 'TRAJECTOIRE_NOT_COMPUTED',
    isCollectiviteNotEpci: trajectoireErrorKey === 'COLLECTIVITE_NOT_EPCI',
  });
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
    if (trajectoireState === 'failed') {
      void trajectoireQuery.refetch();
    }
  };

  const hasLoadingError =
    pertinencesQuery.isLoadingError || mobilisationQuery.isLoadingError;
  if (hasLoadingError || trajectoireState === 'failed') {
    return { status: 'error', retry: retryFailedQueries };
  }

  const isStillLoading = leviers === undefined || mobilisation === undefined;
  if (isStillLoading || trajectoireState === 'loading') {
    return { status: 'loading' };
  }

  return {
    status: 'ready',
    leviers,
    access: toPriorisationAccess({
      hasMobilisation: hasMobilisation(mobilisation),
      trajectoireState,
    }),
  };
};
