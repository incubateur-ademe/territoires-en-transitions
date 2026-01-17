import { getAccessLevelLabel } from '@/app/users/authorizations/permission-access-level.utils';
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
  const { acces, className, size = 'sm' } = props;
  const displayedAcces = getLabel(props);

  return (
    <Badge
      title={displayedAcces}
      size={size}
      state={acces === null ? 'new' : 'info'}
      className={classNames(className, 'pointer-events-none')}
    />
  );
};

const getLabel = ({ acces, isAuditeur }: Props) => {
  if (isAuditeur) {
    return 'audit';
  }
  if (!acces) {
    return 'visite';
  }
  return getAccessLevelLabel(acces);
};
