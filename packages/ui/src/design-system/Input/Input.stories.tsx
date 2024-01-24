import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';

import {Input} from './Input';

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
};

export default meta;

type Story = StoryObj<typeof Input>;

/** Sans aucune props renseignée. */
export const Default: Story = {
  args: {},
};

/** Avec une aide à la saisie quand le champ est vide */
export const AvecPlaceholder: Story = {
  args: {
    placeholder: 'Saisir une valeur',
    'data-test': 'ok',
  },
};

/** Avec une valeur */
export const AvecValeur: Story = {
  args: {
    value: 'plop',
    onChange: action('onChange'),
  },
};

/** Avec icône */
export const AvecIcone: Story = {
  args: {
    placeholder: 'placeholder',
    icon: {value: 'search-line'},
  },
};

/** Avec bouton icône */
export const AvecIconeBouton: Story = {
  args: {
    placeholder: 'placeholder',
    icon: {
      buttonProps: {
        icon: 'search-line',
        onClick: action('onClick'),
        title: 'Rechercher',
      },
    },
  },
};

/** Avec un texte à la place de l'icône */
export const AvecIconeTexte: Story = {
  args: {
    placeholder: 'placeholder',
    icon: {text: 'TTC'},
  },
};

/** Variante en fonction de l'état */
export const AvecBordsColorés: Story = {
  args: {
    placeholder: 'placeholder',
    state: 'error',
    icon: {
      buttonProps: {
        icon: 'search-line',
      },
    },
  },
};

/** Variante small */
export const VarianteSmall: Story = {
  args: {
    size: 'sm',
    placeholder: 'placeholder',
  },
};

/** Variante small et bouton icône */
export const VarianteSmallEtBouton: Story = {
  args: {
    size: 'sm',
    placeholder: 'placeholder',
    icon: {
      buttonProps: {
        icon: 'search-line',
        onClick: action('onClick'),
        title: 'Rechercher',
      },
    },
  },
};

/** Variante small et texte à la place de l'icône */
export const VarianteSmallIconeTexte: Story = {
  args: {
    size: 'sm',
    placeholder: 'placeholder',
    icon: {text: 'TTC'},
  },
};
