'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC, type RouterOutput } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ReactElement, useEffect, useRef } from 'react';
import { AiImportProgress } from './ai-import-progress';
import { AiImportStagesList } from './ai-import-stages';
import { toImportStageViews } from './ai-import-stages.model';
import { toImportStepViews } from './ai-import-steps.model';
import {
  isInaccessibleAiImportError,
  type useGetAiImportStatus,
} from './data/use-get-ai-import-status';

export const AiImportStatusView = ({
  jobId,
  statusQuery,
  onPlanCreated,
  renderOutcome,
  renderStagesProgress,
}: {
  jobId: string;
  statusQuery: ReturnType<typeof useGetAiImportStatus>;
  /** Le suivi consulté depuis l'historique reste ouvert, même après succès. */
  onPlanCreated?: (planId: number, options: { jobId: string }) => void;
  renderOutcome: (
    status: RouterOutput['plans']['aiImport']['getAiImportStatus']
  ) => ReactElement;
  renderStagesProgress?: (stagesList: ReactElement) => ReactElement;
}) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: status, error, refetch } = statusQuery;
  const notifiedOutcome = useRef<string | null>(null);

  useEffect(() => {
    if (!status) return;
    if (status.status !== 'done' && status.status !== 'failed') {
      // Une reprise garde le même job : sa prochaine issue sera traitée.
      notifiedOutcome.current = null;
      return;
    }
    const outcome = `${jobId}:${status.status}:${status.createdPlanId}`;
    if (notifiedOutcome.current === outcome) return;
    notifiedOutcome.current = outcome;
    for (const queryKey of [
      trpc.plans.plans.list.queryKey({ collectiviteId }),
      trpc.plans.aiImport.listRecentAiImports.pathKey(),
      trpc.plans.aiImport.getCurrentAiImport.queryKey({ collectiviteId }),
    ]) {
      queryClient.invalidateQueries({ queryKey });
    }
    if (status.status === 'done' && status.createdPlanId !== null) {
      onPlanCreated?.(status.createdPlanId, { jobId });
    }
  }, [status, jobId, collectiviteId, onPlanCreated, queryClient, trpc]);

  const inaccessible = error ? isInaccessibleAiImportError(error) : false;
  if (error && (inaccessible || !status)) {
    return (
      <ErrorCard
        title={
          inaccessible
            ? appLabels.importPlanIaSuiviIndisponible
            : appLabels.importPlanIaSuiviErreur
        }
        retry={inaccessible ? undefined : () => refetch()}
      />
    );
  }
  if (!status) return <SpinnerLoader className="mx-auto my-10 w-8 h-8" />;

  const failed = status.status === 'failed';
  const done = status.status === 'done';
  if (renderStagesProgress && !failed && !done) {
    return (
      <section data-test="plans.import-ia.suivi">
        {renderStagesProgress(
          <AiImportStagesList
            stages={toImportStageViews(status.stepStates, {
              jobStatus: status.status,
            })}
            withSecteurs={status.withSecteurs}
          />
        )}
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-6" data-test="plans.import-ia.suivi">
      <h2 className="mb-0 text-xl">
        {status.planName ?? appLabels.importPlanIaSansNom}
      </h2>
      {done || failed ? (
        renderOutcome(status)
      ) : (
        <AiImportProgress
          pending={status.status === 'pending'}
          steps={toImportStepViews(status.stepStates, {
            jobStatus: status.status,
          })}
          withSecteurs={status.withSecteurs}
        />
      )}
    </section>
  );
};
