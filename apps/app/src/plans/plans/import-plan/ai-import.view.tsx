'use client';

import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlanImportsUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Modal } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { aiImportQueryState } from './ai-import.query-state';
import { BetaLabel } from '@/app/ui/beta.label';
import { AiImportFlow } from './ai-import.flow';
import { AiImportHistoryView } from './ai-import-history.view';
import { useAiImportAccess } from './data/use-ai-import-access';

const AiImportContent = () => {
  const router = useRouter();
  const collectiviteId = useCollectiviteId();
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const close = () =>
    router.replace(makeCollectivitePlanImportsUrl({ collectiviteId }));
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
    <>
      <AiImportHistoryView showDetails={false} />
      <Modal
        size={isProgressVisible ? 'md' : 'lg'}
        scrollableContent
        title={<BetaLabel>{appLabels.importPlanIaTitre}</BetaLabel>}
        openState={{ isOpen: true, setIsOpen: (isOpen) => !isOpen && close() }}
        dataTest="plans.import-ia.modal"
        render={() => (
          <AiImportFlow
            onPlanCreated={redirectToPlan}
            onProgressVisibilityChange={setIsProgressVisible}
            cancelButton={
              <Button variant="outlined" type="button" onClick={close}>
                {appLabels.annuler}
              </Button>
            }
          />
        )}
      />
    </>
  );
};

export const AiImportView = () => {
  const { isAvailable } = useAiImportAccess();
  const [{ importJobId }] = useQueryStates(aiImportQueryState);

  if (!isAvailable && importJobId !== null) {
    return <AiImportHistoryView />;
  }

  return <AiImportContent />;
};
