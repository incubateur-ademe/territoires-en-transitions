import { useCollectiviteId } from '@/api/collectivites';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import RemoveSharingModal from '@/app/plans/fiches/share-fiche/remove-sharing.modal';
import DeleteFicheModal from '@/app/plans/fiches/shared/delete-fiche.modal';
import { FicheResume } from '@/domain/plans/fiches';

type DeleteOrRemoveFicheSharingModalProps = {
  fiche: Pick<FicheResume, 'titre' | 'plans'> & FicheShareProperties;
  isReadonly?: boolean;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  /** Redirection à la suppression de la fiche (suppression du partage ou de la fiche en elle-même) */
  redirectPath?: string;
};

/**
 * Bouton + modale de suppression du partage d'une fiche action partagée
 */
const DeleteOrRemoveFicheSharingModal = ({
  fiche,
  buttonVariant,
  buttonClassName,
  redirectPath,
  isReadonly,
}: DeleteOrRemoveFicheSharingModalProps) => {
  const { sharedWithCollectivites } = fiche;
  const collectiviteId = useCollectiviteId();

  const isShared = sharedWithCollectivites?.some(
    (sharing) => sharing.id === collectiviteId
  );

  return isShared ? (
    <RemoveSharingModal
      fiche={fiche}
      redirectPath={redirectPath}
      buttonVariant={buttonVariant}
      buttonClassName={buttonClassName}
    />
  ) : (
    <DeleteFicheModal
      fiche={fiche}
      buttonVariant={buttonVariant}
      buttonClassName={buttonClassName}
      redirectPath={redirectPath}
      isReadonly={isReadonly}
    />
  );
};

export default DeleteOrRemoveFicheSharingModal;
