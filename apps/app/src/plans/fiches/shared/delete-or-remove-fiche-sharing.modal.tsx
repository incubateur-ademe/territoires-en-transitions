import { useCollectiviteId } from '@/api/collectivites';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import RemoveSharingModal from '@/app/plans/fiches/share-fiche/remove-sharing.modal';
import DeleteFicheModal from '@/app/plans/fiches/shared/delete-fiche.modal';
import { FicheResume } from '@/domain/plans';
import { PermissionOperation } from '@/domain/users';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';

type DeleteOrRemoveFicheSharingModalProps = {
  fiche: Pick<FicheResume, 'titre' | 'plans'> & FicheShareProperties;
  permissions: PermissionOperation[];
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
  permissions,
}: DeleteOrRemoveFicheSharingModalProps) => {
  const { sharedWithCollectivites } = fiche;
  const collectiviteId = useCollectiviteId();

  const isShared = sharedWithCollectivites?.some(
    (sharing) => sharing.id === collectiviteId
  );
  const hasDeletePermission = hasPermission(permissions, 'plans.fiches.delete');

  if (!hasDeletePermission) {
    return null;
  }

  if (isShared) {
    return (
      <RemoveSharingModal
        fiche={fiche}
        redirectPath={redirectPath}
        buttonVariant={buttonVariant}
        buttonClassName={buttonClassName}
      />
    );
  }

  return (
    <DeleteFicheModal
      fiche={fiche}
      buttonVariant={buttonVariant}
      buttonClassName={buttonClassName}
      redirectPath={redirectPath}
    />
  );

  return null;
};

export default DeleteOrRemoveFicheSharingModal;
