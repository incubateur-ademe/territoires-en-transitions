import { appLabels } from '@/app/labels/catalog';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';
import { useDeleteAxe } from '../data/use-delete-axe';
import { useDeletePlan } from '../data/use-delete-plan';

type Props = {
  children?: JSX.Element;
  planId: number;
  axeId: number;
  axeHasFiche: boolean;
  redirectURL?: string;
  openState?: OpenState;
};

export const DeletePlanOrAxeModal = ({
  children,
  planId,
  axeId,
  axeHasFiche,
  redirectURL,
  openState,
}: Props) => {
  const isPlan = axeId === planId;

  const { mutateAsync: deletePlan } = useDeletePlan(planId, redirectURL);
  const { mutateAsync: deleteAxe } = useDeleteAxe(axeId, planId, redirectURL);

  const labelPlanOrAxe = isPlan ? appLabels.cePlan : appLabels.cetAxe;

  return (
    <Modal
      dataTest="SupprimerFicheModale"
      size={axeHasFiche ? 'lg' : 'sm'}
      title={appLabels.souhaitezVousSupprimer({ labelPlanOrAxe })}
      openState={openState}
      render={
        axeHasFiche
          ? () => (
              <Alert
                state="warning"
                title={appLabels.attentionActionsLiees({ labelPlanOrAxe })}
                description={appLabels.actionsLieesAutrePlan}
              />
            )
          : () => (
              <p className="mb-0">
                {appLabels.aucuneActionDans({ labelPlanOrAxe })}
              </p>
            )
      }
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              if (isPlan) deletePlan();
              else deleteAxe();
              close();
            },
          }}
        />
      )}
    >
      {children}
    </Modal>
  );
};
