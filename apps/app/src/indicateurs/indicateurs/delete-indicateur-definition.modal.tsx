import { useDeleteIndicateurDefinition } from '@/app/indicateurs/indicateurs/use-delete-indicateur-definition';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

/**
 * Modale pour la suppression d'un indicateur personnalisé
 */
type Props = {
  definition: Pick<IndicateurDefinitionListItem, 'id' | 'titre'>;
  openState: OpenState;
  redirectAfterDelete?: boolean;
};

export const DeleteIndicateurDefinitionModal = ({
  definition,
  openState,
  redirectAfterDelete,
}: Props) => {
  const { mutate: deleteIndicateur } = useDeleteIndicateurDefinition(
    definition.id,
    { redirectAfterDelete }
  );
  return (
    <Modal
      openState={openState}
      title={appLabels.suppressionIndicateur}
      subTitle={definition.titre}
      render={() => (
        <p className="mb-0">{appLabels.suppressionIndicateurDescription}</p>
      )}
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
    />
  );
};
