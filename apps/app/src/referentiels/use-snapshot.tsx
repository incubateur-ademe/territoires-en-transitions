import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RouterInput,
  RouterOutput,
  TRPCUseQueryResult,
  useTRPC,
} from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';
import {
  ReferentielException,
  ReferentielId,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { useReferentielId } from './referentiel-context';

export type Snapshot = RouterOutput['referentiels']['snapshots']['getCurrent'];

export type SnapshotDetails =
  RouterOutput['referentiels']['snapshots']['list']['snapshots'][number];

export type ActionDetailed = Snapshot['scoresPayload']['scores'];

export function useSnapshot({
  actionId,
  externalCollectiviteId,
}: {
  actionId: string;
  externalCollectiviteId?: number;
}): TRPCUseQueryResult<Snapshot> {
  const collectiviteId = useCollectiviteId();
  const referentielId = getReferentielIdFromActionId(actionId);
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.snapshots.getCurrent.queryOptions(
      {
        collectiviteId: externalCollectiviteId ?? collectiviteId,
        referentielId,
      },
      DISABLE_AUTO_REFETCH
    )
  );
}

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

export function useAction(actionId: string, externalCollectiviteId?: number) {
  const { data: snapshot, isPending } = useSnapshot({
    actionId,
    externalCollectiviteId,
  });

  const toAction = (snapshot: Snapshot) => {
    const subAction = findByActionId(snapshot.scoresPayload.scores, actionId);

    if (subAction === null) {
      throw new ReferentielException(`Action not found: '${actionId}'`);
    }

    return subAction;
  };

  return {
    isPending,
    data: snapshot ? toAction(snapshot) : undefined,
  };
}

export function useScore(actionId: string, externalCollectiviteId?: number) {
  const { data: action } = useAction(actionId, externalCollectiviteId);

  if (!action) {
    return;
  }

  return action.score;
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

export function useEtatLieuxHasStarted(referentielId: ReferentielId) {
  const {
    data: snapshot,
    isLoading,
    isError,
  } = useSnapshot({ actionId: referentielId });

  if (isLoading || isError || !snapshot) {
    return { started: false, isLoading, isError };
  }

  const { score } = snapshot.scoresPayload.scores;
  return { started: score.completedTachesCount > 0, isLoading, isError };
}

// TODO move this in an helper function in shared domain
// (also check it doesn't exist already)
function findByActionId(
  action: ActionDetailed | undefined,
  actionId: string
): ActionDetailed | null {
  if (!action) {
    return null;
  }

  // Check if current object has the target actionId
  if (action.actionId === actionId) {
    return action;
  }

  // Search through actionsEnfant (children)
  for (const childAction of action.actionsEnfant) {
    const result = findByActionId(childAction, actionId);
    if (result) {
      return result;
    }
  }

  // No match is found
  return null;
}
