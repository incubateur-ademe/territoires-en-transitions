'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PertinenceLevier } from '@tet/domain/collectivites';
import { omit } from 'es-toolkit';
import { toPertinencesListInput } from './to-pertinences-list-input';
import { upsertPertinence } from './upsert-pertinence';

export type UpsertPertinence = (pertinence: PertinenceLevier) => void;

export const useUpsertPertinence = (): UpsertPertinence | undefined => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const listInput = toPertinencesListInput(collectiviteId);
  const listQueryKey =
    trpc.collectivites.pertinenceLeviers.list.queryKey(listInput);
  const upsertMutationKey =
    trpc.collectivites.pertinenceLeviers.upsert.mutationKey();

  const { mutate } = useMutation(
    trpc.collectivites.pertinenceLeviers.upsert.mutationOptions({
      scope: { id: `pertinence-leviers-${collectiviteId}` },
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: listQueryKey });
        queryClient.setQueryData(listQueryKey, (list) => {
          if (list === undefined) {
            return list;
          }
          return {
            ...list,
            pertinences: upsertPertinence({
              pertinences: list.pertinences,
              pertinence: omit(input, ['collectiviteId', 'enjeu']),
            }),
          };
        });
      },
      onSettled: async () => {
        const isLastPendingUpsert =
          queryClient.isMutating({ mutationKey: upsertMutationKey }) === 1;
        if (!isLastPendingUpsert) {
          return;
        }
        await queryClient.invalidateQueries({ queryKey: listQueryKey });
      },
    })
  );

  const canUpsertPertinence = hasCollectivitePermission(
    'collectivites.pertinence-leviers.mutate'
  );
  if (!canUpsertPertinence) {
    return undefined;
  }
  return (pertinence) => mutate({ ...listInput, ...pertinence });
};
