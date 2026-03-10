import { Badge, BadgeSize } from '@tet/ui';

/** Affiche le badge "complété" ou "à compléter" */
export const BadgeACompleter = ({
  isComplete,
  className,
  size = 'sm',
}: {
  isComplete: boolean;
  className?: string;
  size?: BadgeSize;
}) => (
  <Badge
    dataTest="a-completer"
    title={isComplete ? 'Complété' : 'À compléter'}
    variant={isComplete ? 'success' : 'info'}
    size={size}
    className={className}
  />
);
