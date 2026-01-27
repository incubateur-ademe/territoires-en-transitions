import { Button, Modal } from '@tet/ui';
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
      title="Créer un plan"
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
            Annuler
          </Button>
        </div>
      )}
    >
      {children}
    </Modal>
  );
}
