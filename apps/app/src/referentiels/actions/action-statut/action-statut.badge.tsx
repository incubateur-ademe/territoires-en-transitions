import { avancementToLabel } from '@/app/app/labels';
import { ColorVariant, SizeVariant, TypeVariant } from '@tet/design-tokens';
import { StatutAvancementIncludingNonConcerneDetailleALaTache } from '@tet/domain/referentiels';
import { Badge } from '@tet/ui';
import classNames from 'classnames';

type Props = {
  className?: string;
  statut: StatutAvancementIncludingNonConcerneDetailleALaTache;
  barre?: boolean;
  size?: SizeVariant;
};

export const statusToState: Record<
  StatutAvancementIncludingNonConcerneDetailleALaTache,
  { state: ColorVariant; type?: TypeVariant }
> = {
  non_renseigne: { state: 'grey', type: 'outlined' },
  pas_fait: { state: 'warning' },
  programme: { state: 'info' },
  detaille: { state: 'standard' },
  detaille_a_la_tache: { state: 'standard' },
  fait: { state: 'success' },
  non_concerne: { state: 'grey' },
};

const ActionStatutBadge = ({
  className,
  statut,
  barre,
  size = 'xs',
}: Props) => {
  return (
    statut && (
      <Badge
        dataTest="ActionStatutBadge"
        title={avancementToLabel[statut]}
        size={size}
        variant={statusToState[statut].state}
        type={statusToState[statut].type ?? 'solid'}
        trim={false}
        className={classNames(
          'min-w-fit text-nowrap',
          { 'line-through': barre },
          className
        )}
      />
    )
  );
};

export default ActionStatutBadge;
