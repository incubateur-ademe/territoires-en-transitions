import { useCollectiviteId } from '@/api/collectivites';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { FicheWithRelations } from '@/domain/plans/fiches';
import { Alert, Modal, ModalFooterOKCancel } from '@/ui';

type RemoveSharingModalProps = {
  fiche: Pick<
    FicheWithRelations,
    'id' | 'collectiviteNom' | 'titre' | 'sharedWithCollectivites'
  >;
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
  const { mutate: updateFiche } = useUpdateFiche({
    redirectPath,
  });

  return (
    <Modal
      title="Supprimer le partage"
      subTitle={titre || 'Fiche sans titre'}
      render={({ descriptionId }) => (
        // Texte d'avertissement
        <div id={descriptionId} data-test="supprimer-fiche-modale">
          <Alert
            state="warning"
            title={`Cette fiche action vous a été partagée par la collectivité "${collectiviteNom}". Sa suppression de votre collectivité n’affectera pas son existence dans la collectivité qui vous l’a partagée, où elle restera accessible.`}
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
      <DeleteButton
        data-test="RemoveSharingFicheBouton"
        title="Supprimer le partage"
        variant={buttonVariant}
        size="xs"
        className={buttonClassName}
      />
    </Modal>
  );
};

export default RemoveSharingModal;
