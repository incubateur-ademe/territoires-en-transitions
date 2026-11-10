'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { hasPermission } from '@tet/domain/users';
import { Alert, Event, useEventTracker } from '@tet/ui';
import { ReactElement, useEffect, useRef } from 'react';
import { AiImportProgress } from './ai-import-progress';
import { AiImportStagesList } from './ai-import-stages';
import { toImportStageViews } from './ai-import-stages.model';
import type { AiImportOrigine } from './data/use-enqueue-ai-import';
import { toImportStepViews } from './ai-import-steps.model';
import { importIssueLabels } from './ai-import.labels';
import {
  isInaccessibleAiImportError,
  type useGetAiImportStatus,
} from './data/use-get-ai-import-status';
import { useResumeAiImport } from './data/use-resume-ai-import';

export const AiImportStatusView = ({
  jobId,
  statusQuery,
  onPlanCreated,
  onRetry,
  renderStagesProgress,
  origine = 'page',
  demarcheId,
}: {
  jobId: string;
  statusQuery: ReturnType<typeof useGetAiImportStatus>;
  /** Le suivi consulté depuis l'historique reste ouvert, même après succès. */
  onPlanCreated?: (planId: number, options: { jobId: string }) => void;
  onRetry: () => void;
  renderStagesProgress?: (stagesList: ReactElement) => ReactElement;
  origine?: AiImportOrigine;
  demarcheId?: number;
}) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const tracker = useEventTracker();
  const { data: status, error, refetch } = statusQuery;
  const resume = useResumeAiImport();
  const canResume = hasPermission(useUser(), 'plans.fiches.import_resume');
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
  const isErrorInReport = status.report.issues.some(
    (issue) =>
      issue.message === status.error &&
      ['document-error', 'configuration-error', 'processing-error'].includes(
        issue.kind
      )
  );
  if (renderStagesProgress && !failed && !done) {
    return (
      <section data-test="plans.import-ia.suivi">
        {renderStagesProgress(
          <AiImportStagesList
            stages={toImportStageViews(status.stepStates)}
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
      {done ? (
        <Alert state="success" title={appLabels.importPlanIaTermine} />
      ) : (
        <AiImportProgress
          failed={failed}
          pending={status.status === 'pending'}
          errorMessage={isErrorInReport ? null : status.error}
          onRetry={() => {
            tracker(Event.plans.importIa.reessayer, {
              origine,
              demarcheId,
              jobId,
              profile: status.profile,
            });
            onRetry();
          }}
          onResume={
            canResume && status.resumable
              ? () => {
                  tracker(Event.plans.importIa.reprendre, {
                    jobId,
                    profile: status.profile,
                    origine,
                    demarcheId,
                  });
                  resume.mutate({ jobId });
                }
              : undefined
          }
          isResuming={resume.isPending}
          steps={toImportStepViews(status.stepStates, {
            failed,
            jobStatus: status.status,
          })}
          withSecteurs={status.withSecteurs}
        />
      )}
      {done || failed ? (
        <div
          className="flex flex-col gap-4"
          data-test="plans.import-ia.rapport"
        >
          <h3 className="mb-0 text-lg">{appLabels.importPlanIaRapport}</h3>
          {status.report.issues.map((issue, index) => (
            <Alert
              key={`${issue.code}:${index}`}
              state={
                issue.kind === 'warning'
                  ? 'warning'
                  : issue.kind === 'preserved-data'
                  ? 'info'
                  : 'error'
              }
              title={importIssueLabels[issue.kind]}
              description={
                <div className="whitespace-pre-wrap">
                  {issue.location && (
                    <p className="mb-1 font-bold">{issue.location}</p>
                  )}
                  {issue.message}
                </div>
              }
            />
          ))}
          {status.report.qualitativeReview ? (
            <p className="mb-0 whitespace-pre-wrap">
              {status.report.qualitativeReview}
            </p>
          ) : status.report.issues.length === 0 ? (
            <p className="mb-0">{appLabels.importPlanIaRapportSansRemarque}</p>
          ) : null}
          {status.createdPlanId === null && (
            <p className="mb-0 text-sm text-grey-7">
              {appLabels.importPlanIaPlanIndisponible}
            </p>
          )}
        </div>
      ) : (
        <p className="mb-0 text-sm text-grey-7">
          {appLabels.importPlanIaSuiviRetrouvable}
        </p>
      )}
    </section>
  );
};
