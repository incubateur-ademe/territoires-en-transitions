'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Icon } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { AiImportBetaLabel } from './ai-import-beta-label';
import { AiImportFlow } from './ai-import.flow';
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
      router.push(
        makeCollectivitePlanActionUrl({
          collectiviteId,
          planActionUid: planId.toString(),
        })
      ),
    [router, collectiviteId]
  );

  return (
    <div className="flex flex-col">
      <h3 className="mb-8 flex items-center gap-2">
        <Icon icon="import-fill" size="lg" />
        <AiImportBetaLabel>{appLabels.importPlanIaTitre}</AiImportBetaLabel>
      </h3>
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

  if (!isAiPlanImportEnabled) {
    return <RequestPlanImportView />;
  }

  return <AiImportContent />;
};
