'use client';

import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
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
          <p className="mb-0">{appLabels.planImporteValiderDescription}</p>
          <p className="mb-0 text-sm text-grey-8">
            {appLabels.planImporteBeta}
          </p>
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
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
