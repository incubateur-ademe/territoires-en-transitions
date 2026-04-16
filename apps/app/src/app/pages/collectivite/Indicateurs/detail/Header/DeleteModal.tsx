import { useDeleteIndicateurDefinition } from '@/app/indicateurs/indicateurs/use-delete-indicateur-definition';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Modal, ModalFooterOKCancel } from '@tet/ui';

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
      title={appLabels.suppressionIndicateur}
      subTitle={definition.titre}
      description={appLabels.suppressionIndicateurDescription}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            'aria-label': appLabels.supprimer,
            children: appLabels.supprimer,
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
        title={appLabels.supprimerIndicateur}
        aria-label={appLabels.supprimerIndicateur}
        size="xs"
        variant="grey"
      />
    </Modal>
  );
};

export default DeleteModal;
