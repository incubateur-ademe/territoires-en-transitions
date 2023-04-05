import {TAxeInsert} from 'types/alias';
import IconFolderLine from 'ui/icons/IconFolderLine';
import Alerte from 'ui/shared/Alerte';
import Modal from 'ui/shared/floating-ui/Modal';
import {FicheAction} from '../data/types';
import PlanChemin from './PlanChemin';

import TableauNouvelEmplacement from './TableauNouvelEmplacement';

type Props = {
  fiche: FicheAction;
};

const FicheActionRangerModal = ({fiche}: Props) => {
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
            <Alerte
              classname="inline-block mb-8 mr-auto"
              state="information"
              description="Le contenu de la fiche sera mis à jour de manière synchronisée quel que soit l’emplacement"
              small
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
      <button className="fr-btn w-max mb-6 !shadow-none">
        <IconFolderLine className="fill-white w-4 -ml-2 mt-0.5 mr-2" />
        Ranger la fiche
      </button>
    </Modal>
  );
};

export default FicheActionRangerModal;
