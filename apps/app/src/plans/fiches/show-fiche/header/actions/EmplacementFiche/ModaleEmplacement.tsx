import { FicheWithRelations } from '@tet/domain/plans';
import { Button, Modal, Tab, Tabs } from '@tet/ui';
import { useState } from 'react';
import EmplacementActuelFiche from './EmplacementActuel/EmplacementActuelFiche';
import NouvelEmplacementFiche from './NouvelEmplacement/NouvelEmplacementFiche';

/**
 * Bouton + modale pour le déplacement de la fiche action
 */
type ModaleEmplacementProps = {
  fiche: FicheWithRelations;
  isReadonly?: boolean;
};

const ModaleEmplacement = ({ fiche, isReadonly }: ModaleEmplacementProps) => {
  const nbEmplacements = fiche.axes?.length ?? 0;
  const [activeTab, setActiveTab] = useState(nbEmplacements > 0 ? 0 : 1);

  return (
    <Modal
      dataTest="RangerFicheModale"
      title="Ranger la fiche dans un ou plusieurs plans d’action"
      size="xl"
      onClose={() => setActiveTab(0)}
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
    >
      {/* Bouton d'ouverture de la modale */}
      <Button
        data-test="BoutonRangerFiche"
        icon="folder-2-line"
        title="Ranger la fiche dans un plan d’action"
        variant="grey"
        size="xs"
        className="h-fit"
        disabled={isReadonly}
      >
        Ranger
      </Button>
    </Modal>
  );
};

export default ModaleEmplacement;
