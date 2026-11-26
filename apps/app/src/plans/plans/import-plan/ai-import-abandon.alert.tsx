import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';
import { Alert, Button } from '@tet/ui';
import {
  importAbandonAdviceLabels,
  importAbandonProblemLabels,
} from './ai-import.labels';
import { SupportChatLink } from './support-chat.link';

export type ImportAbandon = NonNullable<
  RouterOutput['plans']['aiImport']['getAiImportStatus']['report']['abandon']
>;

/**
 * L'IA a préféré s'arrêter plutôt que d'inventer un plan : le problème, ce
 * qu'elle en dit, les passages du document qui le montrent, quoi faire.
 */
export const AiImportAbandonAlert = ({
  abandon,
  onRetry,
}: {
  abandon: ImportAbandon;
  onRetry?: () => void;
}) => {
  const { motif, evidence, explanation, readingStats } = abandon;
  return (
    <div role="alert" data-test="plans.import-ia.abandon">
      <Alert
        state="warning"
        className="border border-warning-3 p-6"
        title={appLabels.importPlanIaAbandonTitre}
        description={
          <div className="flex flex-col gap-4 text-grey-8">
            <p className="mb-0">
              {importAbandonProblemLabels[motif]}
              {readingStats && (
                <>
                  {' '}
                  {appLabels.importPlanIaAbandonPagesIllisibles(readingStats)}
                </>
              )}
            </p>
            {explanation && (
              <figure
                className="m-0 flex flex-col gap-1"
                data-test="plans.import-ia.abandon.explication"
              >
                <figcaption className="text-sm font-bold text-grey-9">
                  {appLabels.importPlanIaAbandonExplication}
                </figcaption>
                <blockquote className="m-0 border-l-4 border-warning-3 pl-3 italic">
                  {`« ${explanation} »`}
                </blockquote>
              </figure>
            )}
            {evidence.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="mb-0 text-sm font-bold text-grey-9">
                  {appLabels.importPlanIaAbandonPreuves}
                </p>
                <ul
                  className="flex flex-col gap-2 m-0 p-0 list-none"
                  data-test="plans.import-ia.abandon.preuves"
                >
                  {evidence.map(({ citation, page }, index) => (
                    <li
                      key={`${page}:${index}`}
                      className="flex flex-col gap-0.5 rounded border border-grey-3 bg-white p-3 min-w-0 break-words"
                    >
                      <span className="text-xs text-grey-7">
                        {appLabels.importPlanIaAbandonPreuvePage({ page })}
                      </span>
                      <q className="text-grey-9">{citation}</q>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <p className="mb-0 text-sm font-bold text-grey-9">
                {appLabels.importPlanIaAbandonQuoiFaire}
              </p>
              <ul className="flex flex-col gap-1 m-0 pl-5 list-disc">
                {importAbandonAdviceLabels[motif].map((advice) => (
                  <li key={advice} className="p-0">
                    {advice}
                  </li>
                ))}
              </ul>
              <p className="mb-0 text-sm text-grey-7">
                {appLabels.importPlanIaAbandonAucunPlan}
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center gap-4">
            {onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                dataTest="plans.import-ia.abandon.relancer"
              >
                {appLabels.importPlanIaAbandonRelancer}
              </Button>
            )}
            <SupportChatLink>
              {appLabels.importPlanIaContacterSupport}
            </SupportChatLink>
          </div>
        }
      />
    </div>
  );
};
