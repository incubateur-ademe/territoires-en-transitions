import {
  getFicheActionShareIcon,
  getFicheActionShareText,
} from '@/app/plans/fiches/show-fiche/share-fiche/fiche-share-info';
import { FicheWithRelations } from '@/domain/plans';
import { Notification, VisibleWhen } from '@/ui';

const PrivateFicheBadge = () => {
  return (
    <div title="Fiche en accès restreint">
      <Notification icon="lock-fill" size="xs" classname="w-7 h-7" />
    </div>
  );
};

const SharedFicheBadge = ({
  fiche,
  collectiviteId,
}: {
  fiche: FicheWithRelations;
  collectiviteId: number;
}) => {
  return (
    <div title={getFicheActionShareText(fiche, collectiviteId)}>
      <Notification
        icon={getFicheActionShareIcon(fiche, collectiviteId)}
        variant="success"
        size="xs"
        classname="w-7 h-7"
      />
    </div>
  );
};

export const AccessManagementBadges = ({
  fiche,
  collectiviteId,
}: {
  fiche: FicheWithRelations;
  collectiviteId: number;
}) => {
  const isPrivate = fiche.restreint ?? false;
  const isShared = (fiche.sharedWithCollectivites?.length ?? 0) > 0;

  return (
    <div className="flex items-center gap-1">
      <VisibleWhen condition={isPrivate}>
        <PrivateFicheBadge />
      </VisibleWhen>
      <VisibleWhen condition={isShared}>
        <SharedFicheBadge fiche={fiche} collectiviteId={collectiviteId} />
      </VisibleWhen>
    </div>
  );
};
