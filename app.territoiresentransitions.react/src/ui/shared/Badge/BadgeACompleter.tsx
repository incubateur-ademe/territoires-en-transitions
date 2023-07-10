import classNames from 'classnames';
import {Badge} from 'ui/shared/Badge';

/** Affiche le badge "complété" ou "à compléter" */
export const BadgeACompleter = ({
  a_completer,
  className,
}: {
  a_completer: boolean;
  className?: string;
}) =>
  a_completer ? (
    <Badge className={classNames('fr-badge--no-icon', className)} status="info">
      À compléter
    </Badge>
  ) : (
    <Badge
      className={classNames('fr-badge--no-icon', className)}
      status="success"
    >
      Complété
    </Badge>
  );
