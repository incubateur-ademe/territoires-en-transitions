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
    <span
      className={classNames(
        'fr-badge fr-badge--sm fr-badge--no-icon pointer-events-none',
        {
          'fr-badge--info': acces !== null,
          'fr-badge--new': acces === null,
        },
        className
      )}
    >
      {displayedAcces}
    </span>
  );
};

const getLabel = ({acces, isAuditeur}: Props) => {
  if (!acces) {
    return 'visite';
  }
  if (isAuditeur) {
    return 'audit';
  }
  if (acces === 'edition') {
    return 'édition';
  }
  return acces;
};
