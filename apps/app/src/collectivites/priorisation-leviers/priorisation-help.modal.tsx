import { appLabels } from '@/app/labels/catalog';
import { Button, Modal } from '@tet/ui';
import { JSX } from 'react';

export const PriorisationHelpModal = (): JSX.Element => (
  <Modal
    title={appLabels.priorisationFonctionnementTitre}
    size="md"
    render={() => (
      <p className="mb-0">{appLabels.priorisationFonctionnementDescription}</p>
    )}
  >
    <Button variant="outlined" size="xs">
      {appLabels.priorisationFonctionnementTitre}
    </Button>
  </Modal>
);
