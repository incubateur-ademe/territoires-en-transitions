import { useCurrentCollectivite } from '@/api/collectivites';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import RemoveSharingModal from '@/app/plans/fiches/share-fiche/remove-sharing.modal';
import DeleteFicheModal from '@/app/plans/fiches/shared/delete-fiche.modal';
import { FicheResume } from '@/domain/plans';
import { OpenState } from '@/ui/utils/types';

type DeleteOrRemoveFicheSharingModalProps = {
  openState?: OpenState;
  fiche: Pick<FicheResume, 'titre' | 'plans'> & FicheShareProperties;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  /** Redirection à la suppression de la fiche (suppression du partage ou de la fiche en elle-même) */
  redirectPath?: string;
};

/**
 * Bouton + modale de suppression du partage d'une fiche action partagée
 */
const DeleteOrRemoveFicheSharingModal = ({
  openState,
  fiche,
  buttonVariant,
  buttonClassName,
  redirectPath,
}: DeleteOrRemoveFicheSharingModalProps) => {
  const { sharedWithCollectivites } = fiche;
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const isShared = sharedWithCollectivites?.some(
    (sharing) => sharing.id === collectiviteId
  );

  return isShared ? (
    <RemoveSharingModal
      openState={openState}
      fiche={fiche}
      redirectPath={redirectPath}
      buttonVariant={buttonVariant}
      buttonClassName={buttonClassName}
    />
  ) : (
    <DeleteFicheModal
      openState={openState}
      fiche={fiche}
      buttonVariant={buttonVariant}
      buttonClassName={buttonClassName}
      redirectPath={redirectPath}
      isReadonly={isReadOnly}
    />
  );
};

export default DeleteOrRemoveFicheSharingModal;
