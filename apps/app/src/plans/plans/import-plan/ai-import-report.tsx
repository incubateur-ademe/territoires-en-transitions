import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';
import { Alert, Badge, Button, Card, Icon } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { cn } from '@tet/ui/utils/cn';
import { StepStatusIcon } from './ai-import-progress';
import { ImportStepStates, toImportStepViews } from './ai-import-steps.model';
import {
  importIssueHintLabels,
  importIssueLabels,
  importReportStepLabels,
  importStepStatusLabels,
} from './ai-import.labels';
import { SupportChatLink } from './support-chat.link';

type ImportStatus = RouterOutput['plans']['aiImport']['getAiImportStatus'];
type ImportIssue = ImportStatus['report']['issues'][number];

const ImportFailedSteps = ({
  stepStates,
}: {
  stepStates: ImportStepStates;
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    {toImportStepViews(stepStates, { failed: true }).map(({ name, status }) => {
      if (name !== 'reading' && name !== 'extraction') return null;
      return (
        <Card
          key={name}
          role="group"
          aria-label={importReportStepLabels[name]}
          className={cn('m-0 p-4 flex-row items-center gap-4 text-grey-8', {
            'border-2 border-error-1': status === 'failed',
          })}
        >
          <StepStatusIcon status={status} />
          <div>
            <p className="mb-0 font-bold">{importReportStepLabels[name]}</p>
            <p className="mb-0 font-normal text-grey-7">
              {status === 'waiting'
                ? appLabels.importPlanIaEtapeNonCommencee
                : capitalize(importStepStatusLabels[status])}
            </p>
          </div>
        </Card>
      );
    })}
  </div>
);

const ImportIssueCard = ({
  issue,
  position,
  total,
}: {
  issue: ImportIssue;
  position: number;
  total: number;
}) => (
  <Card className="m-0 p-4 md:p-6 font-normal text-grey-8 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Badge
        title={importIssueLabels[issue.kind]}
        variant={
          issue.kind === 'warning'
            ? 'warning'
            : issue.kind === 'preserved-data'
            ? 'info'
            : 'error'
        }
        size="sm"
        trim={false}
      />
      <span className="text-sm text-grey-7">
        {appLabels.importPlanIaRemarquePosition({ position, total })}
      </span>
    </div>
    {issue.location && (
      <p className="mb-0 font-bold text-primary-9">{issue.location}</p>
    )}
    <p className="mb-0 whitespace-pre-wrap">{issue.message}</p>
  </Card>
);

export const AiImportReport = ({
  status,
  onRetry,
  onResume,
  isResuming = false,
}: {
  status: Pick<
    ImportStatus,
    'status' | 'error' | 'report' | 'createdPlanId' | 'stepStates'
  >;
  onRetry: () => void;
  onResume?: () => void;
  isResuming?: boolean;
}) => {
  const failed = status.status === 'failed';
  const { issues, qualitativeReview } = status.report;
  const errorCount = issues.filter(({ kind }) =>
    ['document-error', 'configuration-error', 'processing-error'].includes(kind)
  ).length;
  const issueKinds = new Set(issues.map(({ kind }) => kind));
  // Un échec sans erreur détaillée doit aussi proposer une action.
  if (failed && errorCount === 0) issueKinds.add('processing-error');
  const errorMessage = issues.some(({ message }) => message === status.error)
    ? null
    : status.error;

  return (
    <div className="flex flex-col gap-6" data-test="plans.import-ia.rapport">
      {failed && <ImportFailedSteps stepStates={status.stepStates} />}
      <div role={failed ? 'alert' : 'status'}>
        <Alert
          state={failed ? 'error' : 'success'}
          className={failed ? 'border border-error-3 p-6' : undefined}
          title={
            failed
              ? appLabels.importPlanIaErreur
              : appLabels.importPlanIaTermine
          }
          description={
            <div className="flex flex-col gap-3 text-grey-8">
              {errorCount > 0 && (
                <p className="mb-0">
                  {appLabels.importPlanIaErreursDetectees({
                    count: errorCount,
                  })}
                </p>
              )}
              {failed && errorMessage && (
                <p className="mb-0 whitespace-pre-wrap">{errorMessage}</p>
              )}
              {[...issueKinds].map((kind) =>
                importIssueHintLabels[kind] ? (
                  <p key={kind} className="mb-0">
                    {importIssueHintLabels[kind]}
                  </p>
                ) : null
              )}
            </div>
          }
          footer={
            issueKinds.has('configuration-error') ||
            issueKinds.has('processing-error') ? (
              <SupportChatLink>
                {appLabels.importPlanIaContacterSupport}
              </SupportChatLink>
            ) : undefined
          }
        />
      </div>
      <h3 className="mb-0 text-lg">{appLabels.importPlanIaRapport}</h3>
      {issues.length > 0 && (
        <ol className="flex flex-col gap-4 m-0 p-0 list-none">
          {issues.map((issue, index) => (
            <li
              key={`${issue.code}:${index}`}
              className="p-0 min-w-0 break-words"
            >
              <ImportIssueCard
                issue={issue}
                position={index + 1}
                total={issues.length}
              />
            </li>
          ))}
        </ol>
      )}
      {qualitativeReview ? (
        <p className="mb-0 whitespace-pre-wrap">{qualitativeReview}</p>
      ) : !failed && issues.length === 0 ? (
        <p className="mb-0">{appLabels.importPlanIaRapportSansRemarque}</p>
      ) : null}
      {(status.createdPlanId === null || failed) && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-grey-3 pt-4">
          {status.createdPlanId === null && (
            <p className="flex items-center gap-2 mb-0 text-sm text-grey-7">
              <Icon icon="information-line" />
              {appLabels.importPlanIaPlanIndisponible}
            </p>
          )}
          {failed && (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outlined"
                onClick={onRetry}
                dataTest="plans.import-ia.reessayer-button"
              >
                {appLabels.reessayer}
              </Button>
              {onResume && (
                <Button
                  onClick={onResume}
                  disabled={isResuming}
                  loading={isResuming}
                  dataTest="plans.import-ia.reprendre-button"
                >
                  {appLabels.importPlanIaReprendre}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
