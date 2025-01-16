import { Modal, ModalFooterOKCancel } from '@/ui';
import DeleteButton from '../../../../../../ui/buttons/DeleteButton';
import { useDeleteIndicateurPerso } from '../../Indicateur/useRemoveIndicateurPerso';
import { TIndicateurDefinition } from '../../types';

/**
 * Bouton + modale pour la suppression d'un indicateur personnalisé
 */
type Props = {
  definition: TIndicateurDefinition;
  isLoading?: boolean;
};

const DeleteModal = ({ definition, isLoading = false }: Props) => {
  const { mutate: deleteIndicateurPerso } = useDeleteIndicateurPerso(
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
              deleteIndicateurPerso();
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
