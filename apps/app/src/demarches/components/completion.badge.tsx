import { appLabels } from '@/app/labels/catalog';
import { Badge, type BadgeProps } from '@tet/ui';
import { JSX } from 'react';
import type { DemarcheCompletionStatut } from '../types';

const badgeByStatut: Record<
  DemarcheCompletionStatut,
  { title: string; variant: BadgeProps['variant']; icon: BadgeProps['icon'] }
> = {
  complete: {
    title: appLabels.demarcheCompletionComplete,
    variant: 'success',
    icon: 'check-line',
  },
  incomplete: {
    title: appLabels.demarcheCompletionAComplete,
    variant: 'warning',
    icon: 'time-line',
  },
  // Volet sans exigence : un badge neutre, qui ne se lise ni comme un travail
  // fait ni comme un retard.
  optional: {
    title: appLabels.demarcheCompletionOptionnel,
    variant: 'grey',
    icon: 'information-line',
  },
};

type Props = {
  statut: DemarcheCompletionStatut;
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
  statut,
  size = 'sm',
  withIcon = true,
  trim,
  className,
}: Props): JSX.Element => {
  const { title, variant, icon } = badgeByStatut[statut];

  return (
    <Badge
      className={className}
      trim={trim}
      title={title}
      variant={variant}
      size={size}
      icon={withIcon ? icon : undefined}
    />
  );
};
