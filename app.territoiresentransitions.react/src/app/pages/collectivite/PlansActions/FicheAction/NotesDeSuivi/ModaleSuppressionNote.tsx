import { FicheActionNote } from '@/api/plan-actions';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import DeleteButton from '../DeleteButton';
import { DeletedNote } from '../data/useUpsertNoteSuivi';

type ModaleSuppressionNoteProps = {
  editedNote: FicheActionNote;
  onDelete: (deletedNote: DeletedNote) => void;
};

/**
 * Bouton + modale de suppression d'une fiche action
 */
const ModaleSuppressionNote = ({
  editedNote,
  onDelete,
}: ModaleSuppressionNoteProps) => {
  const year = new Date(editedNote.dateNote).getFullYear();
  return (
    <Modal
      title="Supprimer la note de suivi"
      subTitle={`Note de suivi ${year}${
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
              onDelete({ id: editedNote.id });
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
