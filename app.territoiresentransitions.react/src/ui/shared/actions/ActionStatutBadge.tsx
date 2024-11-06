import classNames from 'classnames';
import { avancementToLabel } from 'app/labels';
import { TActionAvancementExt } from 'types/alias';
import { Badge, BadgeState } from '@tet/ui';

type Props = {
  className?: string;
  statut: TActionAvancementExt;
  // Indique si le statut est barré
  barre?: boolean;
  // Rend une version plus petite du composant
  size?: 'sm' | 'md';
};

export const statusToState: Record<TActionAvancementExt, BadgeState> = {
  non_renseigne: 'grey',
  pas_fait: 'error',
  programme: 'info',
  detaille: 'standard',
  fait: 'success',
  non_concerne: 'grey',
};

const ActionStatutBadge = ({
  className,
  statut,
  barre,
  size = 'sm',
}: Props) => {
  return (
    <Badge
      dataTest="ActionStatutBadge"
      title={avancementToLabel[statut]}
      size={size}
      state={statusToState[statut]}
      light={statut === 'non_renseigne'}
      trim={false}
      className={classNames('min-w-fit', { 'line-through': barre }, className)}
    />
  );
};

export default ActionStatutBadge;
