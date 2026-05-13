import { appLabels } from '@/app/labels/catalog';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { Button } from '@tet/ui';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { UpdateFicheAlertModalBody } from '../../../components/update-fiche-modal-body';

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
  const subtitle = `Note ${year}${
    editedNote.createdBy
      ? appLabels.noteCreeePar({
          prenom: editedNote.createdBy.prenom,
          nom: editedNote.createdBy.nom,
        })
      : ''
  }`;

  return (
    <AlertModal>
      <AlertModal.Trigger>
        <Button
          icon="delete-bin-line"
          variant="white"
          size="xs"
          className="text-grey-6"
          title={appLabels.supprimerNote}
        />
      </AlertModal.Trigger>
      <AlertModal.Header>
        <AlertModal.Title>{appLabels.supprimerNote}</AlertModal.Title>
        <AlertModal.Subtitle>{subtitle}</AlertModal.Subtitle>
      </AlertModal.Header>
      <UpdateFicheAlertModalBody fiche={fiche}>
        <AlertModal.Description>
          {appLabels.supprimerNoteConfirmation}
        </AlertModal.Description>
      </UpdateFicheAlertModalBody>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action onClick={() => onDelete(editedNote.id)}>
          {appLabels.valider}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};
