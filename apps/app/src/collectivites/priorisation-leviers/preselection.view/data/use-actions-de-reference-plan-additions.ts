'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import type {
  ActionDeReference,
  ActionDeReferenceId,
} from '@tet/domain/shared';
import { useCallback, useMemo, useState } from 'react';
import { Preselection } from '../../use-preselection';

export type AddActionToPlanInput = {
  action: ActionDeReference;
  planId: number;
  planNom: string;
};

type UndoActionToPlanInput = {
  actionId: ActionDeReferenceId;
  ficheId: number;
};

export type ActionsDeReferencePlanAdditions = {
  add: (input: AddActionToPlanInput) => void;
  undo: (actionId: ActionDeReferenceId) => void;
  isAdding: (actionId: ActionDeReferenceId) => boolean;
};

const usePendingActionIds = (): {
  isPending: (actionId: ActionDeReferenceId) => boolean;
  start: (actionId: ActionDeReferenceId) => void;
  finish: (actionId: ActionDeReferenceId) => void;
} => {
  const [pendingActionIds, setPendingActionIds] = useState<
    ReadonlySet<ActionDeReferenceId>
  >(new Set());
  const start = useCallback(
    (actionId: ActionDeReferenceId) =>
      setPendingActionIds((current) => new Set([...current, actionId])),
    []
  );
  const finish = useCallback(
    (actionId: ActionDeReferenceId) =>
      setPendingActionIds(
        (current) => new Set([...current].filter((id) => id !== actionId))
      ),
    []
  );
  const isPending = useCallback(
    (actionId: ActionDeReferenceId) => pendingActionIds.has(actionId),
    [pendingActionIds]
  );
  return { isPending, start, finish };
};

export const useActionsDeReferencePlanAdditions = (
  preselection: Pick<
    Preselection,
    'addedToPlanOf' | 'markAddedToPlan' | 'clearAddedToPlan'
  >
): ActionsDeReferencePlanAdditions => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const pendingAdditions = usePendingActionIds();

  const invalidatePlans = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.list.queryKey({ collectiviteId }),
      }),
    [queryClient, trpc, collectiviteId]
  );

  const { mutate: createFiche } = useMutation({
    mutationFn: ({ action, planId }: AddActionToPlanInput) =>
      trpcClient.plans.fiches.create.mutate({
        fiche: {
          collectiviteId,
          titre: action.titre,
          description: action.description,
        },
        ficheFields: { axes: [{ id: planId }] },
      }),
    meta: {
      success: appLabels.actionAjouteeAuPlanSucces,
      error: appLabels.actionAjouteeAuPlanErreur,
    },
    onMutate: ({ action }) => pendingAdditions.start(action.id),
    onSuccess: async (fiche, { action, planNom }) => {
      preselection.markAddedToPlan({
        actionId: action.id,
        ficheId: fiche.id,
        planNom,
      });
      await invalidatePlans();
    },
    onSettled: (_fiche, _error, { action }) =>
      pendingAdditions.finish(action.id),
  });

  const { mutate: deleteFiche } = useMutation({
    mutationFn: ({ ficheId }: UndoActionToPlanInput) =>
      trpcClient.plans.fiches.delete.mutate({ ficheId }),
    meta: {
      success: appLabels.ajoutAuPlanAnnuleSucces,
      error: appLabels.ajoutAuPlanAnnuleErreur,
    },
    onSuccess: async (_result, { actionId }) => {
      preselection.clearAddedToPlan(actionId);
      await invalidatePlans();
    },
  });

  const add = useCallback(
    (input: AddActionToPlanInput): void => {
      if (pendingAdditions.isPending(input.action.id)) {
        return;
      }
      createFiche(input);
    },
    [createFiche, pendingAdditions]
  );

  const undo = useCallback(
    (actionId: ActionDeReferenceId): void => {
      const addedToPlan = preselection.addedToPlanOf(actionId);
      if (addedToPlan === undefined) {
        return;
      }
      deleteFiche({ actionId, ficheId: addedToPlan.ficheId });
    },
    [deleteFiche, preselection]
  );

  return useMemo(
    () => ({ add, undo, isAdding: pendingAdditions.isPending }),
    [add, undo, pendingAdditions.isPending]
  );
};
