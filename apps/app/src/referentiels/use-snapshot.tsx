import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useReferentielId } from './referentiel-context';

type Snapshot = RouterOutput['referentiels']['snapshots']['getCurrent'];

export type SnapshotListItem =
  RouterOutput['referentiels']['snapshots']['list']['snapshots'][number];

export type ActionDetailed = Snapshot['scoresPayload']['scores'];

type UseListSnapshotsProps = Omit<
  RouterInput['referentiels']['snapshots']['list'],
  'collectiviteId'
>;

export function useListSnapshots({
  referentielId,
  options,
}: UseListSnapshotsProps) {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.snapshots.list.queryOptions(
      {
        collectiviteId,
        referentielId,
        options,
      },
      {
        select({ snapshots }) {
          return snapshots;
        },
      }
    )
  );
}

/**
 * @returns the mutation that will re-compute all action's scores,
 * save them into current snapshot, and invalidate the current snapshot query
 */
export function useSnapshotComputeAndUpdate() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: computeScoreAndUpdateCurrentSnapshot } = useMutation(
    trpc.referentiels.snapshots.computeAndUpsert.mutationOptions({
      onSuccess: (snapshot, inputParams) => {
        queryClient.setQueryData(
          trpc.referentiels.snapshots.getCurrent.queryKey(inputParams),
          snapshot
        );

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.listActionsGroupedById.queryKey({
            collectiviteId: snapshot.collectiviteId,
            referentielId: snapshot.referentielId,
          }),
        });
      },
      meta: {
        disableToast: true,
      },
    })
  );

  return {
    computeScoreAndUpdateCurrentSnapshot,
  };
}

export function useSnapshotUpdateName() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  return useMutation(
    trpc.referentiels.snapshots.updateName.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.snapshots.list.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      },
    })
  );
}

export function useSnapshotDelete() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  return useMutation(
    trpc.referentiels.snapshots.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.snapshots.list.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      },
    })
  );
}
