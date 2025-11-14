import { useDeleteFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-delete-fiche';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { FicheListItem } from '../list-all-fiches/data/use-list-fiches';

type DeleteFicheModalProps = {
  openState?: OpenState;
  fiche: Pick<FicheListItem, 'id' | 'titre' | 'plans'>;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  /** Redirection à la suppression de la fiche */
  redirectPath?: string;
};

/**
 * Bouton + modale de suppression d'une fiche action
 */
const DeleteFicheModal = ({
  openState,
  fiche,
  buttonVariant,
  buttonClassName,
  redirectPath,
}: DeleteFicheModalProps) => {
  const { id, titre, plans } = fiche;
  const isInMultipleAxes = !!plans && plans.length > 1;
  const { mutate: deleteFiche } = useDeleteFiche({ redirectPath });

  return (
    <Modal
      openState={openState}
      title="Supprimer la fiche"
      subTitle={titre || 'Fiche sans titre'}
      render={({ descriptionId }) => (
        // Texte d'avertissement
        <div id={descriptionId} data-test="supprimer-fiche-modale">
          {isInMultipleAxes ? (
            <>
              <p className="mb-2">
                Cette fiche action est présente dans plusieurs plans.
              </p>
              <p className="mb-0">
                Souhaitez-vous vraiment supprimer cette fiche de tous les plans
                ?
              </p>
            </>
          ) : (
            <p className="mb-0">
              Souhaitez-vous vraiment supprimer cette fiche action ?
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
      <DeleteButton
        data-test="SupprimerFicheBouton"
        title="Supprimer la fiche"
        variant={buttonVariant}
        size="xs"
        className={buttonClassName}
      />
    </Modal>
  );
};

export default DeleteFicheModal;
