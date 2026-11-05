'use client';

import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlanImportsUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, PageHeader } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useQueryStates } from 'nuqs';
import { aiImportQueryState } from './ai-import.query-state';
import { BetaLabel } from '@/app/ui/beta.label';
import { AiImportFlow } from './ai-import.flow';
import { AiImportHistoryView } from './ai-import-history.view';
import { RequestPlanImportView } from './request-plan-import-view';
import { useIsAiPlanImportEnabled } from './use-is-ai-plan-import-enabled';

const BackButton = () => {
  const router = useRouter();
  return (
    <Button
      variant="outlined"
      icon="arrow-left-line"
      type="button"
      onClick={() => router.back()}
    >
      {appLabels.revenirEtapePrecedente}
    </Button>
  );
};

const AiImportContent = () => {
  const router = useRouter();
  const collectiviteId = useCollectiviteId();
  const redirectToPlan = useCallback(
    (planId: number) =>
      router.replace(
        makeCollectivitePlanActionUrl({
          collectiviteId,
          planActionUid: planId.toString(),
        })
      ),
    [router, collectiviteId]
  );

  return (
    <div className="flex flex-col">
      <PageHeader>
        <PageHeader.Title>
          <BetaLabel>{appLabels.importPlanIaTitre}</BetaLabel>
        </PageHeader.Title>
        <PageHeader.Actions>
          <Button
            variant="outlined"
            href={makeCollectivitePlanImportsUrl({ collectiviteId })}
          >
            {appLabels.importPlanIaHistorique}
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-white rounded-lg">
        <AiImportFlow
          onPlanCreated={redirectToPlan}
          cancelButton={<BackButton />}
        />
      </div>
    </div>
  );
};

export const AiImportView = () => {
  const isAiPlanImportEnabled = useIsAiPlanImportEnabled();
  const [{ importJobId }] = useQueryStates(aiImportQueryState);

  if (!isAiPlanImportEnabled) {
    return importJobId === null ? (
      <RequestPlanImportView />
    ) : (
      <AiImportHistoryView />
    );
  }

  return <AiImportContent />;
};
