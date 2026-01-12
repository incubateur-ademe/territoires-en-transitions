import { Button, Modal, Tab, Tabs } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { Fiche } from '../../../data/use-get-fiche';
import EmplacementActuelFiche from './EmplacementActuel/EmplacementActuelFiche';
import NouvelEmplacementFiche from './NouvelEmplacement/NouvelEmplacementFiche';

export type FicheEmplacement = Pick<Fiche, 'id' | 'axes'>;

/**
 * Bouton + modale pour le déplacement de la fiche action
 *
 * Le bouton de déclenchement de l'ouverture de la modale n'est pas affiché si
 * le composant est contrôlé (`openState` est spécifié)
 */
type ModaleEmplacementProps = {
  fiche: FicheEmplacement;
  isReadonly?: boolean;
  openState?: OpenState;
};

const ModaleEmplacement = ({
  fiche,
  isReadonly,
  openState,
}: ModaleEmplacementProps) => {
  const nbEmplacements = fiche.axes?.length ?? 0;
  const [activeTab, setActiveTab] = useState(nbEmplacements > 0 ? 0 : 1);

  return (
    <Modal
      dataTest="RangerFicheModale"
      title="Ranger l'action dans un ou plusieurs plans"
      size="xl"
      onClose={() => setActiveTab(0)}
      openState={openState}
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
      {openState ? (
        <></>
      ) : (
        <Button
          data-test="BoutonRangerFiche"
          icon="folder-2-line"
          title="Ranger l'action dans un plan"
          variant="grey"
          size="xs"
          className="h-fit"
          disabled={isReadonly}
        >
          Ranger
        </Button>
      )}
    </Modal>
  );
};

export default ModaleEmplacement;
