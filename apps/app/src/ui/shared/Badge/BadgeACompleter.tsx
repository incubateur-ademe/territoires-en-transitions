import { Badge, BadgeSize } from '@tet/ui';

/** Affiche le badge "complété" ou "à compléter" */
export const BadgeACompleter = ({
  a_completer,
  className,
  size = 'sm',
}: {
  a_completer: boolean;
  className?: string;
  size?: BadgeSize;
}) => (
  <Badge
    dataTest="a-completer"
    title={a_completer ? 'À compléter' : 'Complété'}
    variant={a_completer ? 'info' : 'success'}
    size={size}
    className={className}
  />
);
