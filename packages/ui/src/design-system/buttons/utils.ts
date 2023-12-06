import {ButtonVariant} from './types';

/**
 * Thème couleurs du composant Button
 *
 * Pour un variant donné, permet de récupérer les couleurs de
 * texte, background, border et icône en fonction du statut du bouton
 *
 * Utilisation des couleurs configurées dans Tailwind
 **/
export const buttonThemeClassnames: Record<
  ButtonVariant,
  {
    text: string;
    background: string;
    border: string;
    icon: string;
  }
> = {
  primary: {
    text: 'text-white hover:!text-white disabled:!text-primary-3',
    background: 'bg-primary-7 hover:!bg-primary-8 disabled:!bg-primary-4',
    border:
      'border-primary-7 hover:!border-primary-8 disabled:!border-primary-4',
    icon: 'fill-white group-hover:fill-white group-disabled:fill-primary-3',
  },
  secondary: {
    text: 'text-white hover:!text-white disabled:!text-grey-1',
    background: 'bg-secondary-1 hover:!bg-secondary-2 disabled:!bg-secondary-2',
    border:
      'border-secondary-1 hover:!border-secondary-2 disabled:!border-secondary-2',
    icon: 'fill-white group-hover:fill-white group-disabled:fill-grey-1',
  },
  outlined: {
    text: 'text-primary-7 hover:!text-primary-8 disabled:!text-primary-3',
    background: 'bg-white hover:!bg-primary-1 disabled:!bg-white',
    border:
      'border-primary-7 hover:!border-primary-8 disabled:!border-primary-4',
    icon: 'fill-primary-7 group-hover:fill-primary-8 group-disabled:fill-primary-3',
  },
  white: {
    text: 'text-primary-7 hover:!text-primary-8 disabled:!text-primary-4',
    background: 'bg-white hover:!bg-primary-1 disabled:!bg-white',
    border: 'border-white hover:!border-primary-1 disabled:!border-white',
    icon: 'fill-primary-7 group-hover:fill-primary-8 group-disabled:fill-primary-4',
  },
  grey: {
    text: 'text-primary-7 hover:!text-primary-8 disabled:!text-primary-4',
    background: 'bg-grey-1 hover:!bg-grey-2 disabled:!bg-white',
    border: 'border-grey-4 hover:!border-grey-4 disabled:!border-grey-2',
    icon: 'fill-primary-7 group-hover:fill-primary-8 group-disabled:fill-primary-4',
  },
};
