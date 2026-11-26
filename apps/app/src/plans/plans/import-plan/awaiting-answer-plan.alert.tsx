'use client';

import { makeCollectivitePlansActionsImporterIaUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert, Button } from '@tet/ui';
import { ReactNode } from 'react';
import { useGetOngoingAiImport } from './data/use-get-ongoing-ai-import';

/**
 * Un plan en cours d'import dont l'import attend des précisions : on y renvoie,
 * les questions se posent sur la page d'import. Sinon, l'alerte habituelle.
 */
export const AwaitingAnswerPlanAlert = ({
  planId,
  fallback,
}: {
  planId: number;
  fallback: ReactNode;
}) => {
  const collectivite = useCurrentCollectivite();
  const canImport = collectivite.hasCollectivitePermission(
    'plans.fiches.import'
  );
  const { jobId, status, isAwaitingAnswer } = useGetOngoingAiImport(
    collectivite.collectiviteId,
    { enabled: canImport }
  );
  if (!jobId || !isAwaitingAnswer || status?.createdPlanId !== planId) {
    return fallback;
  }
  return (
    <div data-test="plans.plan.import-question-alert">
      <Alert
        className="m-6"
        state="warning"
        title={appLabels.importPlanIaEnAttenteReponse}
        description={appLabels.importPlanIaQuestionAttenteDescription}
        footer={
          <Button
            size="sm"
            href={makeCollectivitePlansActionsImporterIaUrl({
              collectiviteId: collectivite.collectiviteId,
              importJobId: jobId,
            })}
            dataTest="plans.plan.import-question-repondre"
          >
            {appLabels.importPlanIaQuestionRepondre}
          </Button>
        }
      />
    </div>
  );
};
