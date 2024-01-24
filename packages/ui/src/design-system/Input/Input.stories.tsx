import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';

import {Input} from './Input';

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  args: {
    onChange: action('onChange'),
  },
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

/** Date sans aucune props renseignée. */
export const TypeDate: Story = {
  args: {type: 'date'},
};

/** Avec une valeur renseignée. */
export const TypeDateAvecValeur: Story = {
  args: {
    type: 'date',
    value: '2024-01-17',
    onChange: action('onChange'),
  },
};

/** Mot de passe sans aucune props renseignée. */
export const TypePassword: Story = {
  args: {type: 'password'},
};

/** Mdp avec une valeur renseignée. */
export const TypePasswordAvecValeur: Story = {
  args: {
    type: 'password',
    value: 'hyper secret',
    onChange: action('onChange'),
  },
};


/** Recherche sans aucune props renseignée. */
export const TypeSearch: Story = {
  args: {type: 'search'},
};

/** Recherche avec une valeur renseignée. */
export const TypeSearchAvecValeur: Story = {
  args: {
    type: 'search',
    value: 'valeur recherchée',
    onSearch: action('onSearch')
  },
};


/** Etat désactivé */
export const AvecIconeEtDesactive: Story = {
  args: {
    disabled: true,
    placeholder: 'placeholder',
    icon: {value: 'search-line'},
  },
};
export const AvecIconeBoutonEtDesactive: Story = {
  args: {
    disabled: true,
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
export const AvecIconeTexteEtDesactive: Story = {
  args: {
    disabled: true,
    placeholder: 'placeholder',
    icon: {text: 'TTC'},
  },
};

