import Modal from 'ui/shared/floating-ui/Modal';
import {PlanNode} from './data/types';
import {useDeleteAxe} from './data/useDeleteAxe';
import {useRestreindreFiches} from '../FicheAction/data/useRestreindreFiches';

type Props = {
  children: JSX.Element;
  planId: number;
  axes: PlanNode[];
  restreindre: boolean;
};

/**
 * Modale pour modifier la confidentialité des fiches d'un plan.
 */
const RestreindreFichesModal = ({
  children,
  planId,
  axes,
  restreindre,
}: Props) => {
  const {mutate: restreindrePlan} = useRestreindreFiches(axes);
  return (
    <Modal
      noCloseButton
      render={({labelId, descriptionId, close}) => {
        return (
          <div data-test="SupprimerFicheModale" className="mt-2">
            <h6 id={labelId} className="fr-h6">
              {restreindre
                ? 'Souhaitez-vous rendre privées toutes les fiches de ce plan ?'
                : 'Souhaitez-vous rendre publiques toutes les fiches de ce plan ?'}
            </h6>
            <p id={descriptionId} className="mb-4">
              {restreindre
                ? "En passant en privé l'ensemble des fiches de ce plan, elles ne seront plus accessibles par les personnes n’étant pas membres de votre collectivité. Les fiches restent consultables par l’ADEME et le service support de la plateforme"
                : "En passant en public l'ensemble des fiches de ce plan, elles seront accessibles à toutes les personnes n’étant pas membres de votre collectivité."}
            </p>
            <div className="mt-8 fr-btns-group fr-btns-group--left fr-btns-group--inline-reverse fr-btns-group--inline-lg">
              <button
                onClick={close}
                className="fr-btn fr-btn--secondary"
                aria-label="Annuler"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  restreindrePlan({plan_id: planId, restreindre});
                  close();
                }}
                aria-label="Confirmer"
                className="fr-btn"
              >
                Confirmer
              </button>
            </div>
          </div>
        );
      }}
    >
      {children}
    </Modal>
  );
};

export default RestreindreFichesModal;
