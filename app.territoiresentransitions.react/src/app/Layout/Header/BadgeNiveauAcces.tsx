import {Badge} from '@tet/ui';
import classNames from 'classnames';
import {TNiveauAcces} from 'types/alias';

type Props = {
  acces: TNiveauAcces | null;
  isAuditeur?: boolean;
  className?: string;
};

/** Représente le niveau d'accès à une collectivité par un badge */
export const BadgeNiveauAcces = (props: Props) => {
  const {acces, className} = props;
  const displayedAcces = getLabel(props);

  return (
    <Badge
      title={displayedAcces}
      size="sm"
      state={acces === null ? 'new' : 'info'}
      className={classNames(className, 'pointer-events-none')}
    />
  );
};

const getLabel = ({acces, isAuditeur}: Props) => {
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
