import { FicheWithRelations } from '@tet/domain/plans';
import { Modal, Tab, Tabs } from '@tet/ui';
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
        setIsOpen: onClose,
      }}
      dataTest="RangerFicheModale"
      title="Ranger l'action dans un ou plusieurs plans"
      size="xl"
      onClose={() => {
        setActiveTab(0);
        onClose();
      }}
      render={({ descriptionId }) => (
        <div id={descriptionId}>
          <Tabs defaultActiveTab={activeTab} onChange={setActiveTab}>
            <Tab label="Emplacement actuel">
              <EmplacementActuelFiche fiche={fiche} />
            </Tab>
            <Tab label="Nouvel emplacement">
              <NouvelEmplacementFiche
                fiche={fiche}
                onSave={() => setActiveTab(0)}
              />
            </Tab>
          </Tabs>
        </div>
      )}
    />
  );
};
