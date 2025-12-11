import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { ModalFooterOKCancel } from '@tet/ui';
import { DeletedNote } from '../data/use-delete-note';

type NoteDeletionModalProps = {
  fiche: FicheWithRelations;
  editedNote: FicheNote;
  onDelete: (deletedNote: DeletedNote) => void;
};

export const NoteDeletionModal = ({
  fiche,
  editedNote,
  onDelete,
}: NoteDeletionModalProps) => {
  const year = new Date(editedNote.dateNote).getFullYear();
  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      title="Supprimer la note"
      subTitle={`Note ${year}${
        editedNote.createdAt ? ` créée par ${editedNote.createdBy}` : ''
      }`}
      render={({ descriptionId }) => (
        <div id={descriptionId}>
          <p className="mb-0">
            Cette note sera supprimée définitivement de la fiche action.
            Souhaitez-vous vraiment supprimer cette note ?
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
    </BaseUpdateFicheModal>
  );
};
