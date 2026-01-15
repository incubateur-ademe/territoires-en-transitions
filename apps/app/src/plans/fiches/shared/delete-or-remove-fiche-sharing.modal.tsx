import { RemoveSharingModal } from '@/app/plans/fiches/share-fiche/remove-sharing.modal';
import { DeleteFicheModal } from '@/app/plans/fiches/shared/delete-fiche.modal';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { OpenState } from '@tet/ui/utils/types';
import { FicheListItem } from '../list-all-fiches/data/use-list-fiches';

type DeleteOrRemoveFicheSharingModalProps = {
  openState?: OpenState;
  fiche: FicheListItem;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  onDeleteCallback?: () => void;
  onClose?: () => void;
  hideButton?: boolean;
};

export const DeleteOrRemoveFicheSharingModal = ({
  openState,
  fiche,
  buttonVariant,
  buttonClassName,
  onDeleteCallback,
  onClose,
  hideButton = false,
}: DeleteOrRemoveFicheSharingModalProps) => {
  const { sharedWithCollectivites } = fiche;
  const { collectiviteId, permissions } = useCurrentCollectivite();

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
        openState={openState}
        fiche={fiche}
        onDeleteCallback={onDeleteCallback}
        buttonVariant={buttonVariant}
        buttonClassName={buttonClassName}
        onClose={onClose}
        hideButton={hideButton}
      />
    );
  }

  return (
    <DeleteFicheModal
      openState={openState}
      fiche={fiche}
      buttonVariant={buttonVariant}
      buttonClassName={buttonClassName}
      onDeleteCallback={onDeleteCallback}
      onClose={onClose}
      hideButton={hideButton}
    />
  );
};
