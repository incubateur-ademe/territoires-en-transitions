import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';
import { JSX } from 'react';

type Props = {
  isComplete: boolean;
  size?: 'xs' | 'sm';
  /** Le stepper porte déjà un rond d'icône : la répéter dans le badge fait doublon. */
  withIcon?: boolean;
  /** `false` laisse le badge sur une seule ligne quand la place manque. */
  trim?: boolean;
  className?: string;
};

/**
 * Complétude d'une étape du dépôt. Rendu unique de cette information dans tout
 * le parcours démarches — onglets du diagnostic, sections et barre d'avancement
 * la montraient chacun à sa façon, sur les mêmes écrans.
 */
export const DemarcheCompletionBadge = ({
  isComplete,
  size = 'sm',
  withIcon = true,
  trim,
  className,
}: Props): JSX.Element => (
  <Badge
    className={className}
    trim={trim}
    title={
      isComplete
        ? appLabels.demarcheCompletionComplete
        : appLabels.demarcheCompletionAComplete
    }
    variant={isComplete ? 'success' : 'warning'}
    size={size}
    icon={withIcon ? (isComplete ? 'check-line' : 'time-line') : undefined}
  />
);
