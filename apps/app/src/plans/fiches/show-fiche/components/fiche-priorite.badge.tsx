import { Priorite } from '@tet/domain/plans';
import { Badge, BadgeSize, BadgeVariant, cn } from '@tet/ui';

export const prioritesToState: Record<
  Priorite | 'Sans priorité',
  BadgeVariant
> = {
  Bas: 'success',
  Moyen: 'warning',
  Élevé: 'error',
  'Sans priorité': 'grey',
};

type Props = {
  priorite: Priorite | null;
  size?: BadgeSize;
};

/** Badge représentant la priorité d'une fiche */
const FichePrioriteBadge = ({ priorite: defaultPriorite, size }: Props) => {
  const priorite = defaultPriorite ?? 'Sans priorité';

  return (
    <Badge
      className={cn('border-grey-3 bg-grey-1')}
      title={priorite}
      variant={prioritesToState[priorite]}
      size={size}
      type="outlined"
    />
  );
};

export default FichePrioriteBadge;
