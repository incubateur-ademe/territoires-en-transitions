import { Button, Modal } from '@tet/ui';
import { appLabels } from '@/app/labels/catalog';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';
import { CreatePlanOptionLinksList } from './components/create-plan-option-link.list.tsx';

export function CreatePlanModal({
  collectiviteId,
  panierId,
  children,
  openState,
}: {
  collectiviteId: number;
  panierId: string | undefined;
  children?: JSX.Element;
  openState?: OpenState;
}) {
  return (
    <Modal
      size="lg"
      title={appLabels.creerPlan}
      openState={openState}
      render={() => (
        <CreatePlanOptionLinksList
          collectiviteId={collectiviteId}
          panierId={panierId}
        />
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
