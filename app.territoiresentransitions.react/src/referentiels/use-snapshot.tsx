import { useCollectiviteId } from '@/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@/api/utils/react-query/query-options';
import { RouterOutput, trpc } from '@/api/utils/trpc/client';
import {
  ReferentielException,
  ReferentielId,
  getReferentielIdFromActionId,
} from '@/domain/referentiels';
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
}) {
  const collectiviteId = useCollectiviteId();
  const referentielId = getReferentielIdFromActionId(actionId);

  return trpc.referentiels.snapshots.getCurrent.useQuery(
    {
      collectiviteId: externalCollectiviteId ?? collectiviteId,
      referentielId,
    },
    DISABLE_AUTO_REFETCH
  );
}

export function useListSnapshots(referentielId: ReferentielId) {
  const collectiviteId = useCollectiviteId();

  return trpc.referentiels.snapshots.list.useQuery(
    {
      collectiviteId,
      referentielId,
    },
    {
      select({ snapshots }) {
        return snapshots;
      },
    }
  );
}

export function useAction(actionId: string, externalCollectiviteId?: number) {
  const { data: snapshot, ...rest } = useSnapshot({
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
    ...rest,
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
  const trpcUtils = trpc.useUtils();

  const { mutate: computeScoreAndUpdateCurrentSnapshot } =
    trpc.referentiels.snapshots.computeAndUpsert.useMutation({
      onSuccess: (snapshot, inputParams) => {
        trpcUtils.referentiels.snapshots.getCurrent.setData(
          inputParams,
          snapshot
        );
      },
      meta: {
        disableToast: true,
      },
    });

  return {
    computeScoreAndUpdateCurrentSnapshot,
  };
}

export function useSnapshotUpdateName() {
  const trpcUtils = trpc.useUtils();
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  return trpc.referentiels.snapshots.updateName.useMutation({
    onSuccess: () => {
      trpcUtils.referentiels.snapshots.list.invalidate({
        collectiviteId,
        referentielId,
      });
    },
  });
}

export function useSnapshotDelete() {
  const trpcUtils = trpc.useUtils();
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  return trpc.referentiels.snapshots.delete.useMutation({
    onSuccess: () => {
      trpcUtils.referentiels.snapshots.list.invalidate({
        collectiviteId,
        referentielId,
      });
    },
  });
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
