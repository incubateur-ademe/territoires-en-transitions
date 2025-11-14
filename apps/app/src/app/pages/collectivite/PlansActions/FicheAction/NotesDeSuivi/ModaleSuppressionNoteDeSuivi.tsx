import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { FicheNote } from '@/domain/plans';
import { ModalFooterOKCancel } from '@/ui';
import { DeletedNote } from '../data/useUpsertNoteSuivi';

type ModaleSuppressionNoteDeSuiviProps = {
  fiche: FicheShareProperties;
  editedNote: FicheNote;
  onDelete: (deletedNote: DeletedNote) => void;
};

/**
 * Bouton + modale de suppression d'une fiche action
 */
const ModaleSuppressionNoteDeSuivi = ({
  fiche,
  editedNote,
  onDelete,
}: ModaleSuppressionNoteDeSuiviProps) => {
  const year = new Date(editedNote.dateNote).getFullYear();
  return (
    <BaseUpdateFicheModal
      fiche={fiche}
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
    </BaseUpdateFicheModal>
  );
};

export default ModaleSuppressionNoteDeSuivi;
