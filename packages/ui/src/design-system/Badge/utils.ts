import { BadgeType, BadgeVariant } from './index';

/**
 * Thème couleurs du composant Badge
 *
 * Pour un variant donné, permet de récupérer les couleurs de
 * texte, background, border et icône en fonction du statut du bouton
 **/
export const badgeClassnames: Record<
  BadgeVariant,
  Record<
    BadgeType,
    {
      text: string;
      background: string;
      border: string;
      icon: string;
    }
  >
> = {
  default: {
    outlined: {
      text: 'text-grey-8',
      background: 'bg-white',
      border: 'border-grey-5',
      icon: 'text-primary-7',
    },
    solid: {
      text: 'text-grey-8',
      background: 'bg-primary-1',
      border: 'border-grey-5',
      icon: 'text-primary-7',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-primary-7',
      border: 'border-primary-7',
      icon: 'text-white',
    },
  },
  standard: {
    outlined: {
      text: 'text-primary-7',
      background: 'bg-white',
      border: 'border-grey-5',
      icon: 'text-primary-7',
    },
    solid: {
      text: 'text-primary-7',
      background: 'bg-primary-2',
      border: 'border-primary-7',
      icon: 'text-primary-7',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-primary-7',
      border: 'border-primary-7',
      icon: 'text-white',
    },
  },
  hight: {
    outlined: {
      text: 'text-primary-9',
      background: 'bg-white',
      border: 'border-primary-9',
      icon: 'text-primary-9',
    },
    solid: {
      text: 'text-primary-9',
      background: 'bg-primary-2',
      border: 'border-primary-9',
      icon: 'text-primary-9',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-primary-9',
      border: 'border-primary-9',
      icon: 'text-white',
    },
  },
  success: {
    outlined: {
      text: 'text-success-1',
      background: 'bg-white',
      border: 'border-grey-5',
      icon: 'text-success-1',
    },
    solid: {
      text: 'text-success-1',
      background: 'bg-success-2',
      border: 'border-success-1',
      icon: 'text-success-1',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-success-1',
      border: 'border-success-1',
      icon: 'text-white',
    },
  },
  warning: {
    outlined: {
      text: 'text-warning-1',
      background: 'bg-white',
      border: 'border-grey-5',
      icon: 'text-warning-1',
    },
    solid: {
      text: 'text-warning-1',
      background: 'bg-warning-2',
      border: 'border-warning-1',
      icon: 'text-warning-1',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-warning-1',
      border: 'border-warning-1',
      icon: 'text-white',
    },
  },
  new: {
    outlined: {
      text: 'text-new-1',
      background: 'bg-white',
      border: 'border-grey-5',
      icon: 'text-new-1',
    },
    solid: {
      text: 'text-new-1',
      background: 'bg-new-2',
      border: 'border-new-1',
      icon: 'text-new-1',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-new-1',
      border: 'border-new-1',
      icon: 'text-white',
    },
  },
  error: {
    outlined: {
      text: 'text-error-1',
      background: 'bg-white',
      border: 'border-grey-5',
      icon: 'text-error-1',
    },
    solid: {
      text: 'text-error-1',
      background: 'bg-error-2',
      border: 'border-error-1',
      icon: 'text-error-1',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-error-1',
      border: 'border-error-1',
      icon: 'text-white',
    },
  },
  info: {
    outlined: {
      text: 'text-info-1',
      background: 'bg-white',
      border: 'border-grey-5',
      icon: 'text-info-1',
    },
    solid: {
      text: 'text-info-1',
      background: 'bg-info-2',
      border: 'border-info-1',
      icon: 'text-info-1',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-info-1',
      border: 'border-info-1',
      icon: 'text-white',
    },
  },
  grey: {
    outlined: {
      text: 'text-grey-8',
      background: 'bg-white',
      border: 'border-grey-5',
      icon: 'text-grey-8',
    },
    solid: {
      text: 'text-grey-8',
      background: 'bg-grey-3',
      border: 'border-grey-8',
      icon: 'text-grey-8',
    },
    inverted: {
      text: 'text-white',
      background: 'bg-grey-8',
      border: 'border-grey-8',
      icon: 'text-white',
    },
  },
  custom: {
    outlined: {
      text: '',
      background: '',
      border: '',
      icon: '',
    },
    solid: {
      text: '',
      background: '',
      border: '',
      icon: '',
    },
    inverted: {
      text: '',
      background: '',
      border: '',
      icon: '',
    },
  },
};
