import { appLabels } from '@/app/labels/catalog';
import { Badge, type BadgeProps } from '@tet/ui';
import { JSX } from 'react';
import type { DemarcheCompletionStatut } from '../types';

// Badges pleins : en teinte pâle, « À compléter » passait inaperçu.
const badgeByStatut: Record<
  DemarcheCompletionStatut,
  { title: string; variant: BadgeProps['variant']; icon?: BadgeProps['icon'] }
> = {
  complete: {
    title: appLabels.demarcheCompletionComplete,
    variant: 'success',
    icon: 'check-line',
  },
  incomplete: {
    title: appLabels.demarcheCompletionAComplete,
    variant: 'warning',
  },
  // Volet sans exigence : un badge neutre, qui ne se lise ni comme un travail
  // fait ni comme un retard.
  optional: {
    title: appLabels.demarcheCompletionOptionnel,
    variant: 'grey',
  },
};

/**
 * Props du badge pour un statut donné, pour les rendus qui composent leur
 * propre badge (les onglets du diagnostic passent par celui du design system).
 */
export const getDemarcheCompletionBadgeProps = (
  statut: DemarcheCompletionStatut,
  { withIcon = true }: { withIcon?: boolean } = {}
): Pick<BadgeProps, 'title' | 'variant' | 'type' | 'icon' | 'iconPosition'> => {
  const { title, variant, icon } = badgeByStatut[statut];
  return {
    title,
    variant,
    type: 'inverted',
    icon: withIcon ? icon : undefined,
    iconPosition: 'left',
  };
};

type Props = {
  statut: DemarcheCompletionStatut;
  size?: 'xs' | 'sm';
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
  return (
    <Badge
      className={className}
      trim={trim}
      size={size}
      {...getDemarcheCompletionBadgeProps(statut, { withIcon })}
    />
  );
};
