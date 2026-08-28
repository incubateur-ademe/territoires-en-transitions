'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { listDiagnosticTabs } from '../diagnostic.tabs.utils';

export type PcaetDiagnostic =
  RouterOutput['demarches']['pcaet']['diagnostic']['get'];

export const useGetPcaetDiagnostic = (demarcheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.demarches.pcaet.diagnostic.get.queryOptions({
      collectiviteId,
      demarcheId,
    })
  );

  return {
    diagnostic: data ?? null,
    tabs: data ? listDiagnosticTabs(data) : [],
    isLoading,
    isError,
    refetch,
  };
};
