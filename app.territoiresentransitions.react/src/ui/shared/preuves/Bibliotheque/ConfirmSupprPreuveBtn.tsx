import Modal, {RenderProps} from 'ui/shared/floating-ui/Modal';
import {ButtonRemove} from 'ui/buttons/SmallIconButton';

// Affiche le bouton d'ouverture de la modale de confirmation de suppression
// d'une preuve
export const ConfirmSupprPreuveBtn = ({
  removePreuve,
}: {
  removePreuve: () => void;
}) => (
  <Modal
    size="md"
    render={modalProps => (
      <ConfirmSupprPreuve {...modalProps} onOK={removePreuve} />
    )}
  >
    <ButtonRemove title="Supprimer" className="fr-fi-delete-line" />
  </Modal>
);

// Affiche la modale de confirmation de suppression d'une preuve
const ConfirmSupprPreuve = ({
  labelId,
  descriptionId,
  close,
  onOK,
}: RenderProps & {onOK: () => void}) => {
  return (
    <div data-test="ConfirmSupprPreuve">
      <h4 id={labelId} className="fr-h4">
        Supprimer le document
      </h4>
      <p id={descriptionId}>Voulez-vous vraiment supprimer ce document ?</p>
      <div className="mt-8 fr-btns-group fr-btns-group--inline-lg">
        <button onClick={close} className="fr-btn fr-btn--secondary">
          Annuler
        </button>
        <button
          data-test="ok"
          onClick={() => {
            onOK();
            close();
          }}
          className="fr-btn"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};
