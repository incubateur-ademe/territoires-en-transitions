import { getCollectiviteRoleLabel } from '@/app/users/authorizations/collectivite-role.utils';
import { CollectiviteRole } from '@tet/domain/users';
import { Badge, BadgeSize } from '@tet/ui';
import classNames from 'classnames';

type Props = {
  acces: CollectiviteRole | null;
  isAuditeur?: boolean;
  size?: BadgeSize;
  className?: string;
};

/** Représente le niveau d'accès à une collectivité par un badge */
export const BadgeNiveauAcces = (props: Props) => {
  const { acces, className, size = 'xs', isAuditeur } = props;
  const displayedAcces = getLabel({ acces, isAuditeur });

  return (
    <Badge
      title={displayedAcces}
      size={size}
      variant={acces === null ? 'new' : 'info'}
      className={classNames(className, 'pointer-events-none')}
    />
  );
};

const getLabel = ({
  acces,
  isAuditeur,
}: {
  acces: CollectiviteRole | null;
  isAuditeur?: boolean;
}): string => {
  if (isAuditeur) {
    return 'audit';
  }
  if (!acces) {
    return 'visite';
  }
  return getCollectiviteRoleLabel(acces);
};
