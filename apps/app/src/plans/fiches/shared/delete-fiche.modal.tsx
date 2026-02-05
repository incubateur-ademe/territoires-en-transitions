import { useDeleteFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-delete-fiche';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Alert, cn, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import {
  FicheListItem,
  useListFiches,
} from '../list-all-fiches/data/use-list-fiches';

type DeleteFicheModalProps = {
  openState?: OpenState;
  fiche: FicheListItem;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  onDeleteCallback?: () => void;
  onClose?: () => void;
  hideButton?: boolean;
  /** ID du plan pour la mise à jour optimiste (optionnel) */
  planId?: number;
  /** ID de l'axe pour la mise à jour optimiste (optionnel) */
  axeId?: number;
};

export const DeleteFicheModal = ({
  openState,
  fiche,
  buttonVariant,
  buttonClassName,
  onDeleteCallback,
  onClose,
  hideButton = false,
  planId,
  axeId,
}: DeleteFicheModalProps) => {
  const { id, titre, plans } = fiche;

  const { mutate: deleteFiche } = useDeleteFiche({
    onDeleteCallback,
    planId,
    axeId,
  });

  const { count: countSousActions } = useListFiches(
    fiche.collectiviteId,
    {
      filters: { parentsId: [fiche.id] },
      queryOptions: { limit: 1, page: 1 },
    },
    openState?.isOpen
  );

  const isInMultipleAxes = !!plans && plans.length > 1;

  const hasSousActions = countSousActions > 0;

  return (
    <Modal
      openState={openState}
      title="Supprimer l'action"
      subTitle={titre || 'Action sans titre'}
      onClose={onClose}
      render={({ descriptionId }) => (
        // Texte d'avertissement
        <div
          id={descriptionId}
          data-test="supprimer-fiche-modale"
          className="flex flex-col gap-2"
        >
          <span
            className={cn('text-center', {
              'mb-4': isInMultipleAxes || hasSousActions,
            })}
          >
            Souhaitez-vous vraiment supprimer cette action ?
          </span>
          {isInMultipleAxes && (
            <Alert
              state="warning"
              description="Cette action est partagée entre plusieurs plans et sera supprimée partout."
            />
          )}
          {hasSousActions && (
            <Alert
              state="warning"
              description="Cette action contient des sous-actions qui seront également supprimées."
            />
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
