import { JSX } from 'react';
import { uiLabels } from '@tet/ui/labels/catalog';
import { cn } from '../../utils/cn';
import { Badge, BadgeProps } from '../Badge';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const badgePropsByStatus: Record<
  Exclude<AutosaveStatus, 'idle'>,
  Pick<BadgeProps, 'title' | 'variant' | 'icon' | 'iconClassname'>
> = {
  saving: {
    title: uiLabels.enregistrementEnCours,
    variant: 'grey',
    icon: 'loader-3-line',
    iconClassname: 'animate-spin-slow',
  },
  saved: {
    title: uiLabels.enregistre,
    variant: 'success',
    icon: 'check-line',
  },
  error: {
    title: uiLabels.nonEnregistre,
    variant: 'error',
    icon: 'error-warning-line',
  },
};

type Props = {
  status: AutosaveStatus;
  className?: string;
  dataTest?: string;
};

/**
 * État d'enregistrement d'une saisie sans bouton « Enregistrer ».
 * La région `status` reste montée même vide : un lecteur d'écran n'annonce
 * que les changements d'une région live déjà présente dans le DOM.
 */
export const AutosaveBadge = ({
  status,
  className,
  dataTest,
}: Props): JSX.Element => (
  <div
    role="status"
    data-test={dataTest}
    className={cn(
      'shrink-0 transition-opacity duration-200',
      status === 'idle' ? 'opacity-0' : 'opacity-100',
      className
    )}
  >
    {status !== 'idle' && (
      <Badge
        {...badgePropsByStatus[status]}
        size="sm"
        type="outlined"
        iconPosition="left"
        uppercase={false}
      />
    )}
  </div>
);
