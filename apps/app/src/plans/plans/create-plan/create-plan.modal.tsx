import { Button, Modal } from '@tet/ui';
import { appLabels } from '@/app/labels/catalog';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';
import { CreatePlanOptionLinksList } from './components/create-plan-option-link.list.tsx';

export function AddPlanModal({
  collectiviteId,
  children,
  openState,
}: {
  collectiviteId: number;
  children?: JSX.Element;
  openState?: OpenState;
}) {
  return (
    <Modal
      size="lg"
      title={appLabels.ajouterPlan}
      openState={openState}
      render={() => (
        <CreatePlanOptionLinksList collectiviteId={collectiviteId} />
      )}
      renderFooter={({ close }) => (
        <div className="flex justify-center">
          <Button size="xs" onClick={close} variant="outlined">
            {appLabels.annuler}
          </Button>
        </div>
      )}
    >
      {children}
    </Modal>
  );
}
