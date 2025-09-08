import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-indicateur-definition';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { useDeleteIndicateurDefinition } from '../../../../../../indicateurs/definitions/use-delete-indicateur-definition';
import DeleteButton from '../../../../../../ui/buttons/DeleteButton';

/**
 * Bouton + modale pour la suppression d'un indicateur personnalisé
 */
type Props = {
  definition: IndicateurDefinition;
  isLoading?: boolean;
};

const DeleteModal = ({ definition, isLoading = false }: Props) => {
  const { mutate: deleteIndicateur } = useDeleteIndicateurDefinition(
    definition.id
  );
  return (
    <Modal
      title="Suppression de l'indicateur"
      subTitle={definition.titre}
      description="Êtes-vous sûr de vouloir supprimer cet indicateur personnalisé ? Vous perdrez définitivement les données associées à cet indicateur."
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            'aria-label': 'Supprimer',
            children: 'Supprimer',
            onClick: () => {
              deleteIndicateur();
              close();
            },
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      <DeleteButton
        disabled={isLoading}
        title="Supprimer l'indicateur"
        aria-label="Supprimer l'indicateur"
        size="xs"
        variant="grey"
      />
    </Modal>
  );
};

export default DeleteModal;
