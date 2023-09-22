import Modal from 'ui/shared/floating-ui/Modal';

type Props = {
  isInMultipleAxes: boolean;
  onDelete: () => void;
};

const FicheActionSupprimerModal = ({isInMultipleAxes, onDelete}: Props) => {
  return (
    <Modal
      render={({labelId, descriptionId, close}) => {
        return (
          <div data-test="supprimer-fiche-modale">
            <h4 id={labelId} className="fr-h4">
              Supprimer la fiche action
            </h4>
            <p id={descriptionId}>
              {isInMultipleAxes ? (
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
                onClick={() => {
                  onDelete();
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
      <button
        data-test="SupprimerFicheBouton"
        className="fr-btn fr-btn--tertiary fr-btn--sm fr-fi-delete-line hover:!bg-gray-200"
        title="Supprimer la fiche"
      />
    </Modal>
  );
};

export default FicheActionSupprimerModal;
