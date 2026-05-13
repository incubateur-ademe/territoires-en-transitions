import { useDeleteIndicateurDefinition } from '@/app/indicateurs/indicateurs/use-delete-indicateur-definition';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';

type Props = {
  definition: IndicateurDefinition;
  isLoading?: boolean;
};

const DeleteModal = ({ definition, isLoading = false }: Props) => {
  const { mutate: deleteIndicateur } = useDeleteIndicateurDefinition(
    definition.id
  );

  return (
    <AlertModal>
      <AlertModal.Trigger>
        <DeleteButton
          disabled={isLoading}
          title={appLabels.supprimerIndicateur}
          aria-label={appLabels.supprimerIndicateur}
          size="xs"
          variant="grey"
        />
      </AlertModal.Trigger>
      <AlertModal.Header>
        <AlertModal.Title>{appLabels.suppressionIndicateur}</AlertModal.Title>
        <AlertModal.Subtitle>{definition.titre}</AlertModal.Subtitle>
      </AlertModal.Header>
      <AlertModal.Body>
        <AlertModal.Description>
          {appLabels.suppressionIndicateurDescription}
        </AlertModal.Description>
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action
          aria-label={appLabels.supprimer}
          onClick={() => deleteIndicateur()}
        >
          {appLabels.supprimer}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};

export default DeleteModal;
