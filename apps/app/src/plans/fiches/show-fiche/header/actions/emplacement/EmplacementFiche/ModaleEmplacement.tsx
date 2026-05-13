import { appLabels } from '@/app/labels/catalog';
import { FicheWithRelations } from '@tet/domain/plans';
import { Tab, Tabs } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import EmplacementActuelFiche from './EmplacementActuel/EmplacementActuelFiche';
import NouvelEmplacementFiche from './NouvelEmplacement/NouvelEmplacementFiche';

export const ModaleEmplacement = ({
  fiche,
  onClose,
}: {
  fiche: FicheWithRelations;
  onClose: () => void;
}) => {
  const nbEmplacements = fiche.axes?.length ?? 0;
  const [activeTab, setActiveTab] = useState(nbEmplacements > 0 ? 0 : 1);

  return (
    <Modal
      openState={{
        isOpen: true,
        setIsOpen: (open) => {
          if (!open) {
            setActiveTab(0);
            onClose();
          }
        },
      }}
      size="xl"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.mutualiserAction}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs defaultActiveTab={activeTab} onChange={setActiveTab}>
          <Tab label={appLabels.emplacementActuel}>
            <EmplacementActuelFiche />
          </Tab>
          <Tab label={appLabels.nouvelEmplacement}>
            <NouvelEmplacementFiche
              fiche={fiche}
              onSave={() => setActiveTab(0)}
            />
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};
