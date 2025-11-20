import { Badge } from '@tet/ui';

/** Affiche le badge "complété" ou "à compléter" */
export const BadgeACompleter = ({
  a_completer,
  className,
  size = 'md',
}: {
  a_completer: boolean;
  className?: string;
  size?: 'sm' | 'md';
}) => (
  <Badge
    dataTest="a-completer"
    title={a_completer ? 'À compléter' : 'Complété'}
    state={a_completer ? 'info' : 'success'}
    size={size}
    className={className}
  />
);
