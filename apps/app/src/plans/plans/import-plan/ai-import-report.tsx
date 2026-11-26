import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';
import { Accordion, Alert, Badge, Button, Card, Icon } from '@tet/ui';
import { useId } from 'react';
import { AiImportAbandonAlert } from './ai-import-abandon.alert';
import { importIssueHintLabels, importIssueLabels } from './ai-import.labels';
import { SupportChatLink } from './support-chat.link';

type ImportStatus = RouterOutput['plans']['aiImport']['getAiImportStatus'];
type ImportIssue = ImportStatus['report']['issues'][number];

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

const ImportIssuesList = ({ issues }: { issues: ImportIssue[] }) => (
  <ol className="flex flex-col gap-4 m-0 p-0 list-none">
    {issues.map((issue, index) => (
      <li key={`${issue.code}:${index}`} className="p-0 min-w-0 break-words">
        <ImportIssueCard
          issue={issue}
          position={index + 1}
          total={issues.length}
        />
      </li>
    ))}
  </ol>
);

export const AiImportReport = ({
  status,
  onRetry,
  onResume,
  isResuming = false,
}: {
  status: Pick<
    ImportStatus,
    'status' | 'error' | 'report' | 'createdPlanId' | 'content'
  >;
  onRetry: () => void;
  onResume?: () => void;
  isResuming?: boolean;
}) => {
  const warningsId = useId();
  const failed = status.status === 'failed';
  const { issues, qualitativeReview, abandon } = status.report;
  // Les passages relevés sont dans l'alerte : pas de remarque en double.
  if (failed && abandon) {
    return (
      <div className="flex flex-col gap-6" data-test="plans.import-ia.rapport">
        <AiImportAbandonAlert abandon={abandon} onRetry={onRetry} />
      </div>
    );
  }
  const warnings = issues.filter(({ kind }) => kind === 'warning');
  const visibleIssues =
    warnings.length > 1
      ? issues.filter(({ kind }) => kind !== 'warning')
      : issues;
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
              {!failed && status.content && (
                <p className="mb-0">
                  {appLabels.importPlanIaTermineContenu(status.content)}
                </p>
              )}
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
      {visibleIssues.length > 0 && <ImportIssuesList issues={visibleIssues} />}
      {warnings.length > 1 && (
        <Accordion
          id={warningsId}
          dataTest="plans.import-ia.avertissements"
          title={appLabels.importPlanIaAvertissementsAConsulter({
            count: warnings.length,
          })}
          icon="error-warning-line"
          content={
            <div id={warningsId} className="pb-6">
              <ImportIssuesList issues={warnings} />
            </div>
          }
        />
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
