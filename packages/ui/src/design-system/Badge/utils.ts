import {BadgeState} from './index';

/**
 * Thème couleurs du composant Badge
 *
 * Pour un variant donné, permet de récupérer les couleurs de
 * texte, background, border et icône en fonction du statut du bouton
 **/
export const badgeClassnames: Record<
  BadgeState,
  {
    text: string;
    background: string;
    border: string;
    icon: string;
  }
> = {
  default: {
    text: 'text-grey-8',
    background: 'bg-grey-1',
    border: 'border-grey-5',
    icon: 'text-grey-8',
  },
  standard: {
    text: 'text-primary-7',
    background: 'bg-primary-2',
    border: 'border-primary-2',
    icon: 'text-primary-7',
  },
  success: {
    text: 'text-success-1',
    background: 'bg-success-2',
    border: 'border-success-2',
    icon: 'text-success-1',
  },
  warning: {
    text: 'text-warning-1',
    background: 'bg-warning-2',
    border: 'border-warning-2',
    icon: 'text-warning-1',
  },
  new: {
    text: 'text-new-1',
    background: 'bg-new-2',
    border: 'border-new-2',
    icon: 'text-new-1',
  },
  error: {
    text: 'text-error-1',
    background: 'bg-error-2',
    border: 'border-error-2',
    icon: 'text-error-1',
  },
  info: {
    text: 'text-info-1',
    background: 'bg-info-2',
    border: 'border-info-2',
    icon: 'text-info-1',
  },
  grey: {
    text: 'text-grey-6',
    background: 'bg-grey-3',
    border: 'border-grey-3',
    icon: 'text-grey-6',
  },
};
