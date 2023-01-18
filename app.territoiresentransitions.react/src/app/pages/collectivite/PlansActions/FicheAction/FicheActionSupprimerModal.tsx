import Modal from 'ui/shared/floating-ui/Modal';

type Props = {
  onDelete: () => void;
};

const FicheActionSupprimerModal = ({onDelete}: Props) => {
  return (
    <Modal
      render={({labelId, descriptionId, close}) => {
        return (
          <div data-test="modification-email-modal">
            <h4 id={labelId} className="fr-h4">
              Supprimer la fiche action
            </h4>
            <p id={descriptionId}>
              Êtes-vous certain de vouloir supprimer cette fiche action?
            </p>
            <div className="mt-2 fr-btns-group fr-btns-group--left fr-btns-group--inline-reverse fr-btns-group--inline-lg">
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
      <div className="inline-flex border border-red-700">
        <button
          className="fr-btn fr-btn--secondary fr-text-default--error !shadow-none"
          // onClick={() => deleteFiche(fiche.id!)}
        >
          Supprimer cette fiche
        </button>
      </div>
    </Modal>
  );
};

export default FicheActionSupprimerModal;
