'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { TRPCClientError } from '@trpc/client';

export type DemarchePcaetConsultation =
  RouterOutput['demarches']['pcaet']['getPublic'];

type DemarcheRef = { collectiviteId: number; demarcheId: number };

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof TRPCClientError && error.data?.code === 'NOT_FOUND';

/** Une démarche absente le restera : la redemander ne ferait que retarder la 404. */
const retryUnlessNotFound = (failureCount: number, error: unknown) =>
  !isNotFoundError(error) && failureCount < 3;

export const useDemarchePcaetConsultation = (ref: DemarcheRef) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.getPublic.queryOptions(ref, {
      retry: retryUnlessNotFound,
    })
  );
};

export const usePublicDiagnostic = (ref: DemarcheRef) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.getPublicDiagnostic.queryOptions(ref, {
      retry: retryUnlessNotFound,
    })
  );
};
