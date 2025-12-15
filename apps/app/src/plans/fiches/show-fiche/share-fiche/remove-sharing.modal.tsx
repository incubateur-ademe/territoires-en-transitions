import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Alert, Button, Modal, ModalFooterOKCancel } from '@tet/ui';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';

type RemoveSharingModalProps = {
  fiche: FicheWithRelations;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  /** Redirige vers le plan ou la page toutes les fiches action à la suppression de la fiche */
  redirectPath?: string;
};

/**
 * Bouton + modale de suppression du partage d'une fiche action partagée
 */
const RemoveSharingModal = ({
  fiche,
  buttonVariant,
  buttonClassName,
  redirectPath,
}: RemoveSharingModalProps) => {
  const { id, titre, collectiviteNom } = fiche;
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const { mutate: updateFiche } = useUpdateFiche({
    onUpdateCallback: () => {
      if (redirectPath) {
        router.push(redirectPath);
      }
    },
  });

  return (
    <Modal
      title="Retirer le partage"
      subTitle={titre || 'Action sans titre'}
      render={({ descriptionId }) => (
        // Texte d'avertissement
        <div id={descriptionId} data-test="supprimer-fiche-modale">
          <Alert
            state="warning"
            title={`Cette action vous a été partagée par la collectivité "${collectiviteNom}". Sa suppression de votre collectivité n’affectera pas son existence dans la collectivité qui vous l’a partagée, où elle restera accessible.`}
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
      <Button
        data-test="RemoveSharingFicheBouton"
        title="Retirer le partage"
        size="xs"
        icon="indeterminate-circle-line"
        variant={buttonVariant ?? 'grey'}
        className={classNames(
          '!text-error-1 hover:!text-[#db4f4f]',
          buttonClassName
        )}
      />
    </Modal>
  );
};

export default RemoveSharingModal;
