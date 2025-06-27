import { TNiveauAcces } from '@/app/types/alias';
import { Badge, BadgeSize } from '@/ui';
import classNames from 'classnames';

type Props = {
  acces: TNiveauAcces | null;
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
  if (acces === 'edition') {
    return 'édition';
  }
  return acces;
};
