import { useDeleteIndicateurDefinition } from '@/app/indicateurs/indicateurs/use-delete-indicateur-definition';
import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

/**
 * Modale pour la suppression d'un indicateur personnalisé
 */
type Props = {
  definition: IndicateurDefinition;
  openState: OpenState;
};

const DeleteModal = ({ definition, openState }: Props) => {
  const { mutate: deleteIndicateur } = useDeleteIndicateurDefinition(
    definition.id
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

export default DeleteModal;
