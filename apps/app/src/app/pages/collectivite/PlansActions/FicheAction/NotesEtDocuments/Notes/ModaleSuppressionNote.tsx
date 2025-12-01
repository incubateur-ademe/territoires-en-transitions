import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { ModalFooterOKCancel } from '@tet/ui';
import { Fiche } from '../../data/use-get-fiche';

type ModaleSuppressionNoteProps = {
  fiche: Fiche;
  onDelete: () => void;
};

/**
 * Bouton + modale de suppression d'une note de fiche action
 */
const ModaleSuppressionNote = ({
  fiche,
  onDelete,
}: ModaleSuppressionNoteProps) => {
  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      title="Supprimer la note"
      render={({ descriptionId }) => (
        <div id={descriptionId}>
          <p className="mb-0">
            La note sera définitivement supprimée. Voulez-vous vraiment la
            supprimer ?
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
    </BaseUpdateFicheModal>
  );
};

export default ModaleSuppressionNote;
