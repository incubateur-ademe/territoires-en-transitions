import { Fiche } from '@/app/plans/fiches/data/use-get-fiche';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert, Button, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import classNames from 'classnames';
import { useUpdateFiche } from '../update-fiche/data/use-update-fiche';

type RemoveSharingModalProps = {
  openState?: OpenState;
  fiche: Pick<Fiche, 'titre'> & FicheShareProperties;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  onDeleteCallback?: () => void;
  onClose?: () => void;
  hideButton?: boolean;
};

export const RemoveSharingModal = ({
  openState,
  fiche,
  buttonVariant,
  buttonClassName,
  onDeleteCallback,
  onClose,
  hideButton = false,
}: RemoveSharingModalProps) => {
  const { id, titre, collectiviteNom } = fiche;
  const collectiviteId = useCollectiviteId();
  const { mutate: updateFiche } = useUpdateFiche({
    onUpdateCallback: onDeleteCallback,
  });

  return (
    <Modal
      openState={openState}
      title={appLabels.retirerPartage}
      subTitle={titre || appLabels.actionSansTitre}
      onClose={onClose}
      render={({ descriptionId }) => (
        // Texte d'avertissement
        <div id={descriptionId} data-test="supprimer-fiche-modale">
          <Alert
            state="warning"
            title={appLabels.retirerPartageDescription({
              collectiviteNom: collectiviteNom ?? '',
            })}
          />
        </div>
      )}
      // Boutons pour valider / annuler la suppression
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              const sharingWithoutCollectiviteId =
                fiche.sharedWithCollectivites?.filter(
                  (sharing) => sharing.id !== collectiviteId
                ) || [];

              updateFiche({
                ficheId: id,
                ficheFields: {
                  sharedWithCollectivites: sharingWithoutCollectiviteId,
                },
              });
              close();
            },
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      {hideButton ? undefined : (
        <Button
          data-test="RemoveSharingFicheBouton"
          title={appLabels.retirerPartage}
          size="xs"
          icon="indeterminate-circle-line"
          variant={buttonVariant ?? 'grey'}
          className={classNames(
            '!text-error-1 hover:!text-[#db4f4f]',
            buttonClassName
          )}
        />
      )}
    </Modal>
  );
};
