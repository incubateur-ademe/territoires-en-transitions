import {BoutonAttention} from 'ui/buttons/BoutonAttention';
import Modal from 'ui/shared/floating-ui/Modal';
import {FicheAction} from './data/types';

type Props = {
  fiche: FicheAction;
  onDelete: () => void;
};

const FicheActionSupprimerModal = ({fiche, onDelete}: Props) => {
  const isFicheInMultipleAxes = fiche.axes && fiche.axes.length > 1;
  return (
    <Modal
      render={({labelId, descriptionId, close}) => {
        return (
          <div data-test="supprimer-fiche-modale">
            <h4 id={labelId} className="fr-h4">
              Supprimer la fiche action
            </h4>
            <p id={descriptionId}>
              {isFicheInMultipleAxes ? (
                <span>
                  Cette fiche action est présente dans plusieurs plans.
                  <br />
                  Souhaitez-vous vraiment supprimer cette fiche de tous les
                  plans ?
                </span>
              ) : (
                'Souhaitez-vous vraiment supprimer cette fiche action ?'
              )}
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
                onClick={onDelete}
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
      <BoutonAttention data-test="SupprimerFicheBouton">
        Supprimer cette fiche
      </BoutonAttention>
    </Modal>
  );
};

export default FicheActionSupprimerModal;
