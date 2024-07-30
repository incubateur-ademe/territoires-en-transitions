import {Button, Modal, Tab, Tabs} from '@tet/ui';
import {FicheAction} from '../../../FicheAction/data/types';
import EmplacementActuelFiche from './EmplacementActuel/EmplacementActuelFiche';
import NouvelEmplacementFiche from './NouvelEmplacement/NouvelEmplacementFiche';
import {useState} from 'react';

/**
 * Bouton + modale pour le déplacement de la fiche action
 */
type ModaleEmplacementProps = {
  fiche: FicheAction;
};

const ModaleEmplacement = ({fiche}: ModaleEmplacementProps) => {
  const nbEmplacements = fiche.axes?.length ?? 0;
  const [activeTab, setActiveTab] = useState(nbEmplacements > 0 ? 0 : 1);

  return (
    <Modal
      title="Ranger la fiche dans un ou plusieurs plans d’action"
      size="xl"
      onClose={() => setActiveTab(0)}
      render={({descriptionId}) => (
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
        icon="folder-2-line"
        title="Ranger la fiche dans un plan d’action"
        variant="outlined"
        size="xs"
        className="h-fit"
      />
    </Modal>
  );
};

export default ModaleEmplacement;
