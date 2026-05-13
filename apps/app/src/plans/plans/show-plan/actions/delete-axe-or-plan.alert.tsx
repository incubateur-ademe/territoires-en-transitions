import { appLabels } from '@/app/labels/catalog';
import { Alert } from '@tet/ui';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
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
    <AlertModal
      openState={openState}
      size={axeHasFiche ? 'lg' : 'md'}
    >
      {children && <AlertModal.Trigger>{children}</AlertModal.Trigger>}
      <AlertModal.Header>
        <AlertModal.Title>
          {appLabels.souhaitezVousSupprimer({ labelPlanOrAxe })}
        </AlertModal.Title>
      </AlertModal.Header>
      <AlertModal.Body>
        {axeHasFiche ? (
          <Alert
            state="warning"
            title={appLabels.attentionActionsLiees({ labelPlanOrAxe })}
            description={appLabels.actionsLieesAutrePlan}
          />
        ) : (
          <AlertModal.Description>
            {appLabels.aucuneActionDans({ labelPlanOrAxe })}
          </AlertModal.Description>
        )}
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action
          onClick={() => {
            if (isPlan) deletePlan();
            else deleteAxe();
          }}
        >
          {appLabels.valider}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};
