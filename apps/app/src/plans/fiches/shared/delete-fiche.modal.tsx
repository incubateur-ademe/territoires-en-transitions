import { useDeleteFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-delete-fiche';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { FicheListItem } from '../list-all-fiches/data/use-list-fiches';

type DeleteFicheModalProps = {
  openState?: OpenState;
  fiche: Pick<FicheListItem, 'id' | 'titre' | 'plans'>;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  onDeleteCallback?: () => void;
  onClose?: () => void;
  hideButton?: boolean;
};

export const DeleteFicheModal = ({
  openState,
  fiche,
  buttonVariant,
  buttonClassName,
  onDeleteCallback,
  onClose,
  hideButton = false,
}: DeleteFicheModalProps) => {
  const { id, titre, plans } = fiche;
  const isInMultipleAxes = !!plans && plans.length > 1;
  const { mutate: deleteFiche } = useDeleteFiche({ onDeleteCallback });

  return (
    <Modal
      openState={openState}
      title="Supprimer l'action"
      subTitle={titre || 'Action sans titre'}
      onClose={onClose}
      render={({ descriptionId }) => (
        // Texte d'avertissement
        <div id={descriptionId} data-test="supprimer-fiche-modale">
          {isInMultipleAxes ? (
            <>
              <p className="mb-2">
                Cette action est présente dans plusieurs plans.
              </p>
              <p className="mb-0">
                Souhaitez-vous vraiment supprimer cette action de tous les plans
                ?
              </p>
            </>
          ) : (
            <p className="mb-0">
              Souhaitez-vous vraiment supprimer cette action ?
            </p>
          )}
        </div>
      )}
      // Boutons pour valider / annuler la suppression
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              deleteFiche({
                ficheId: id,
              });
              close();
            },
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      {hideButton ? undefined : (
        <DeleteButton
          data-test="SupprimerFicheBouton"
          title="Supprimer l'action"
          variant={buttonVariant}
          size="xs"
          className={buttonClassName}
        />
      )}
    </Modal>
  );
};
