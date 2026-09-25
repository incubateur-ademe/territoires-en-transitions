'use client';

import { appLabels } from '@/app/labels/catalog';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useVerifyPlan } from './data/use-verify-plan';

export const VerifyImportedPlanModal = ({
  planId,
  openState,
}: {
  planId: number;
  openState: OpenState;
}) => {
  const { mutate: verifyPlan, isPending } = useVerifyPlan(planId);

  return (
    <Modal
      size="md"
      title={appLabels.planImporteValiderTitre}
      openState={openState}
      dataTest="plans.verify-imported-plan-modal"
      render={() => (
        <>
          <Alert
            state="warning"
            title={appLabels.planImporteValiderAvertissementTitre}
            description={appLabels.planImporteValiderAvertissement}
          />
          <p className="mb-0 text-sm text-grey-8">
            {appLabels.planImporteValiderEngagement}
          </p>
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            children: appLabels.planImporteValiderConfirmer,
            loading: isPending,
            disabled: isPending,
            onClick: () => verifyPlan({ planId }, { onSuccess: close }),
            dataTest: 'plans.verify-imported-plan-modal.confirmer',
          }}
        />
      )}
    />
  );
};
