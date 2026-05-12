import { SizeVariant } from '@tet/design-tokens';
import { Priorite } from '@tet/domain/plans';
import { Badge, cn } from '@tet/ui';

export type PrioriteColorKey = 'success' | 'warning' | 'error' | 'grey';

export const prioriteToColorKey: Record<
  Priorite | 'Sans priorité',
  PrioriteColorKey
> = {
  Bas: 'success',
  Moyen: 'warning',
  Élevé: 'error',
  'Sans priorité': 'grey',
};

type Props = {
  priorite: Priorite | null;
  size?: SizeVariant;
};

/** Badge représentant la priorité d'une fiche */
const FichePrioriteBadge = ({ priorite: defaultPriorite, size }: Props) => {
  const priorite = defaultPriorite ?? 'Sans priorité';

  return (
    <Badge
      className={cn('border-grey-3 bg-grey-1')}
      title={priorite}
      variant={prioriteToColorKey[priorite]}
      size={size}
      type="outlined"
    />
  );
};

export default FichePrioriteBadge;
