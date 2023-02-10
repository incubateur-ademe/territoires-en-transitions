import Alerte from 'ui/shared/Alerte';
import Modal from 'ui/shared/floating-ui/Modal';
import {TPlanActionAxeInsert} from '../../PlanAction/data/types/alias';
import {FicheActionVueRow} from '../data/types/ficheActionVue';
import PlanChemin from './PlanChemin';

import TableauNouvelEmplacement from './TableauNouvelEmplacement';

type Props = {
  fiche: FicheActionVueRow;
};

const FicheActionRangerModal = ({fiche}: Props) => {
  return (
    <Modal
      size="xl"
      render={({labelId, close}) => {
        return (
          <div data-test="ranger-fiche-modale" className="flex flex-col mb-6">
            <h4 id={labelId} className="fr-h4 !mb-8">
              Ranger la fiche dans un ou plusieurs plans d’action
            </h4>
            <h6 className="text-lg">
              Emplacements sélectionnés pour cette fiche
            </h6>
            <div className="flex flex-col gap-2 mb-6">
              {fiche.axes ? (
                fiche.axes.map((axe: TPlanActionAxeInsert) => (
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
            />
            <h6 className="text-lg">Sélectionner un nouvel emplacement</h6>

            <TableauNouvelEmplacement fiche={fiche} />
            <button
              onClick={close}
              className="fr-btn fr-btn--secondary mt-8 ml-auto"
              aria-label="Annuler"
            >
              Retour à la fiche
              <div className="fr-fi-arrow-right-line ml-2 mt-1 scale-75" />
            </button>
          </div>
        );
      }}
    >
      <button className="fr-btn w-max mb-6 !shadow-none">
        <div className="fr-fi-file-line -ml-2 mt-1 mr-2 scale-75" />
        Ranger la fiche
      </button>
    </Modal>
  );
};

export default FicheActionRangerModal;
