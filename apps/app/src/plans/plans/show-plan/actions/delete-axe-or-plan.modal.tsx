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

  const labelPlanOrAxe = isPlan ? 'ce plan' : 'cet axe';

  return (
    <Modal
      dataTest="SupprimerFicheModale"
      size={axeHasFiche ? 'lg' : 'md'}
      title={`Souhaitez-vous supprimer ${labelPlanOrAxe} ?`}
      openState={openState}
      description={
        axeHasFiche
          ? undefined
          : `Il n'y a aucune action dans ${labelPlanOrAxe} et son arborescence.`
      }
      render={
        axeHasFiche
          ? () => (
              <Alert
                state="warning"
                title={`Attention : les actions liées à ${labelPlanOrAxe} seront également supprimées !`}
                description="Les actions liées à un autre plan ou mutualisées ne seront pas impactées."
              />
            )
          : undefined
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
