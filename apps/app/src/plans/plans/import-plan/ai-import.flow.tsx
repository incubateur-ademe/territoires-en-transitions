'use client';

import { useToastContext } from '@/app/utils/toast/toast-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { AiImportProgress } from './ai-import-progress';
import { toImportStepViews } from './ai-import-steps.model';
import { AiImportForm, AiImportFormValues } from './ai-import.form';
import { useEnqueueAiImport } from './data/use-enqueue-ai-import';
import { useGetAiImportStatus } from './data/use-get-ai-import-status';
import { useGetCurrentAiImport } from './data/use-get-current-ai-import';

const CheckingOngoingImport = () => (
  <div className="flex justify-center py-10">
    <SpinnerLoader className="w-8 h-8" />
  </div>
);

/**
 * Formulaire puis suivi d'un import. Reprend l'import déjà en cours de la
 * collectivité s'il y en a un : un seul import à la fois par collectivité.
 */
export const AiImportFlow = ({
  onPlanCreated,
  cancelButton,
  lockedPlanTypeId,
}: {
  /**
   * `startedHere` : l'import a été lancé depuis ce formulaire, et non repris
   * d'un import en cours lancé ailleurs, peut-être avec un autre type de plan.
   */
  onPlanCreated: (planId: number, options: { startedHere: boolean }) => void;
  cancelButton: ReactElement;
  lockedPlanTypeId?: number;
}) => {
  const collectiviteId = useCollectiviteId();
  const { setToast } = useToastContext();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: currentImport, isFetchedAfterMount } =
    useGetCurrentAiImport(collectiviteId);
  // `undefined` tant que l'utilisateur n'a rien lancé ni abandonné : on suit
  // alors l'import en cours de la collectivité, s'il y en a un.
  const [chosenJobId, setJobId] = useState<string | null | undefined>();
  // Le cache peut encore tenir un import terminé depuis : le reprendre
  // rappellerait aussitôt onPlanCreated pour un plan déjà traité.
  const isCheckingOngoingImport =
    chosenJobId === undefined && !isFetchedAfterMount;
  const resumedJobId = isFetchedAfterMount
    ? (currentImport?.jobId ?? null)
    : null;
  const jobId = chosenJobId === undefined ? resumedJobId : chosenJobId;

  const enqueue = useEnqueueAiImport();
  const { data: status } = useGetAiImportStatus(jobId);

  const createdPlanId =
    status?.status === 'done' ? status.createdPlanId : null;
  const notifiedPlanId = useRef<number | null>(null);
  useEffect(() => {
    if (createdPlanId === null || notifiedPlanId.current === createdPlanId) {
      return;
    }
    notifiedPlanId.current = createdPlanId;
    queryClient.invalidateQueries({
      queryKey: trpc.plans.plans.list.queryKey({ collectiviteId }),
    });
    onPlanCreated(createdPlanId, {
      startedHere: typeof chosenJobId === 'string',
    });
  }, [
    createdPlanId,
    chosenJobId,
    onPlanCreated,
    queryClient,
    trpc,
    collectiviteId,
  ]);

  const handleSubmit = async (values: AiImportFormValues) => {
    try {
      const { jobId: newJobId } = await enqueue.mutateAsync({
        collectiviteId,
        file: values.file,
        planName: values.planName,
        planType: values.planType ?? undefined,
        instructions: values.instructions.trim() || undefined,
        withVerifications: values.withVerifications,
        withSousActions: values.withSousActions,
      });
      setJobId(newJobId);
    } catch (error) {
      setToast('error', getErrorMessage(error));
    }
  };

  if (isCheckingOngoingImport) {
    return <CheckingOngoingImport />;
  }
  if (jobId !== null) {
    return (
      <AiImportProgress
        failed={status?.status === 'failed'}
        errorMessage={status?.error ?? null}
        onRetry={() => setJobId(null)}
        steps={toImportStepViews(status?.stepStates)}
      />
    );
  }
  return (
    <AiImportForm
      onSubmit={handleSubmit}
      cancelButton={cancelButton}
      lockedPlanTypeId={lockedPlanTypeId}
    />
  );
};
