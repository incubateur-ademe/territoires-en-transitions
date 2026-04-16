import { appLabels } from '@/app/labels/catalog';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { Button, ModalFooterOKCancel } from '@tet/ui';
import { BaseUpdateFicheModal } from '../../components/base-update-fiche.modal';

type NoteDeletionModalProps = {
  fiche: FicheWithRelations;
  editedNote: FicheNote;
  onDelete: (deletedNoteId: number) => void;
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
      title={appLabels.supprimerNote}
      subTitle={`Note ${year}${
        editedNote.createdBy
          ? appLabels.noteCreeePar({
              prenom: editedNote.createdBy.prenom,
              nom: editedNote.createdBy.nom,
            })
          : ''
      }`}
      render={({ descriptionId }) => (
        <div id={descriptionId}>
          <p className="mb-0">{appLabels.supprimerNoteConfirmation}</p>
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              onDelete(editedNote.id);
              close();
            },
          }}
        />
      )}
    >
      <Button
        icon="delete-bin-line"
        variant="white"
        size="xs"
        className="text-grey-6"
        title={appLabels.supprimerNote}
      />
    </BaseUpdateFicheModal>
  );
};
