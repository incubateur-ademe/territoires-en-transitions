import { Modal, ModalFooterOKCancel } from '@tet/ui';
import DeleteButton from '../DeleteButton';

type ModaleSuppressionNoteProps = {
  editedNote: {
    id: string;
    note: string;
    year: number;
    createdAt: string;
    createdBy: string;
    modifiedAt?: string;
    modifiedBy?: string;
  };
  onDelete: () => void;
};

/**
 * Bouton + modale de suppression d'une fiche action
 */
const ModaleSuppressionNote = ({
  editedNote,
  onDelete,
}: ModaleSuppressionNoteProps) => {
  return (
    <Modal
      title="Supprimer la note de suivi"
      subTitle={`Note de suivi ${editedNote.year}${
        editedNote.createdAt ? ` créée par ${editedNote.createdBy}` : ''
      }`}
      render={({ descriptionId }) => (
        <div id={descriptionId}>
          <p className="mb-0">
            Cette note sera supprimée définitivement de la fiche action.
            Souhaitez-vous vraiment supprimer cette note de suivi ?
          </p>
        </div>
      )}
      // Boutons pour valider / annuler la suppression
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              onDelete();
              close();
            },
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      <DeleteButton title="Supprimer la note" size="xs" />
    </Modal>
  );
};

export default ModaleSuppressionNote;
