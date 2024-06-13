import {TAxeInsert} from 'types/alias';
import Modal from 'ui/shared/floating-ui/Modal';
import {FicheAction} from '../data/types';
import PlanChemin from './PlanChemin';

import TableauNouvelEmplacement from './TableauNouvelEmplacement';
import {Alert} from '@tet/ui';

type Props = {
  toggleButtonTitle?: string;
  fiche: FicheAction;
};

const FicheActionRangerModal = ({fiche, toggleButtonTitle}: Props) => {
  return (
    <Modal
      size="xl"
      render={({labelId, close}) => {
        return (
          <div data-test="RangerFicheModale" className="flex flex-col mb-6">
            <h4 id={labelId} className="fr-h4 !mb-8">
              Ranger la fiche dans un ou plusieurs plans d’action
            </h4>
            <h6 className="text-lg mb-3">
              Emplacements sélectionnés pour cette fiche
            </h6>
            <div className="flex flex-col gap-2 mb-6">
              {fiche.axes ? (
                fiche.axes.map((axe: TAxeInsert) => (
                  <div key={axe.id} className="mr-auto">
                    <PlanChemin fiche={fiche} axe_id={axe.id!} />
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  Aucun emplacement sélectionné
                </span>
              )}
            </div>
            <Alert
              className="mb-8"
              title="Le contenu de la fiche sera mis à jour de manière synchronisée quel que soit l’emplacement"
            />
            <h6 className="text-lg">Sélectionner un nouvel emplacement</h6>

            <TableauNouvelEmplacement fiche={fiche} />
            <button
              onClick={close}
              className="fr-btn fr-btn--tertiary mt-8 ml-auto fr-btn--icon-right fr-fi-arrow-right-line"
              aria-label="Annuler"
            >
              Retour à la fiche
            </button>
          </div>
        );
      }}
    >
      <button
        data-test="BoutonRangerFiche"
        className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-folder-2-line"
        title={toggleButtonTitle}
      />
    </Modal>
  );
};

export default FicheActionRangerModal;
