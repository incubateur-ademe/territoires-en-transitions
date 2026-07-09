import { getCollectiviteRoleLabel } from '@/app/users/authorizations/collectivite-role.utils';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { Badge, cn } from '@tet/ui';

type CollectiviteAcces = Pick<CollectiviteCurrent, 'role' | 'isRoleAuditeur'>;

/** Représente le niveau d'accès à une collectivité par un badge */
export const BadgeNiveauAcces = ({
  collectivite,
  className,
}: {
  collectivite: CollectiviteAcces;
  className?: string;
}) => {
  return (
    <Badge
      title={getLabel(collectivite)}
      size="xs"
      variant={collectivite.role === null ? 'new' : 'info'}
      className={cn('pointer-events-none', className)}
    />
  );
};

const getLabel = (collectivite: CollectiviteAcces): string => {
  if (collectivite.isRoleAuditeur) {
    return 'audit';
  }

  if (!collectivite.role) {
    return 'visite';
  }

  return getCollectiviteRoleLabel(collectivite.role);
};
