import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef, useState } from 'react';
import { action } from 'storybook/actions';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
  component: Input,
  render: (args) => {
    const [value, setValue] = useState(args.value);
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <Input
        {...args}
        ref={inputRef}
        value={value}
        onChange={(e) => {
          action('onChange')(e.target.value);
          action('inputRef.current.value')(inputRef.current?.value);
          setValue(e.target.value);
        }}
      />
    );
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
    icon: { value: 'search-line' },
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
    icon: { text: 'TTC' },
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
    displaySize: 'sm',
    placeholder: 'placeholder',
  },
};

/** Variante small et bouton icône */
export const VarianteSmallEtBouton: Story = {
  args: {
    displaySize: 'sm',
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
    displaySize: 'sm',
    placeholder: 'placeholder',
    icon: { text: 'TTC' },
  },
};

/** Date sans aucune props renseignée. */
export const TypeDate: Story = {
  args: { type: 'date' },
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
  args: { type: 'password' },
};

/** Mdp avec une valeur renseignée. */
export const TypePasswordAvecValeur: Story = {
  args: {
    type: 'password',
    value: 'hyper secret',
    onChange: action('onChange'),
  },
};

/** Valeur non renseignée. */
export const TypeSearch: Story = {
  args: { type: 'search', onSearch: action('onSearch') },
};

/** Recherche avec une valeur renseignée. */
export const TypeSearchAvecValeur: Story = {
  args: {
    type: 'search',
    value: 'valeur recherchée',
    onSearch: action('onSearch'),
  },
};

/** Saisie numérique */
export const TypeNumberInt: Story = {
  args: {
    type: 'number',
    // `onChange` renvoi la valeur formatée sous forme de chaîne
    // mais la valeur int sous-jacente peut être récupérée ainsi :
    onValueChange: (values) => action('onValueChange')(Number(values.value)),
  },
};
export const TypeNumberIntAvecValeur: Story = {
  args: {
    type: 'number',
    value: '12345',
  },
};

export const TypeNumberFloat: Story = {
  args: {
    type: 'number',
    numType: 'float',
    // `onChange` renvoi la valeur formatée sous forme de chaîne
    // mais la valeur float sous-jacente peut être récupérée ainsi :
    onValueChange: (values) =>
      action('onValueChange')(Number(values.floatValue)),
  },
  render: TypeNumberInt.render,
};

export const TypeNumberFloatAvecValeur: Story = {
  args: {
    type: 'number',
    numType: 'float',
    value: '12345.67',
  },
};

/** Saisie avec pattern */
export const TypePattern: Story = {
  args: {
    type: 'pattern',
    format: '# # # #',
    mask: '_',
    allowEmptyFormatting: true,
  },
};

export const TypePatternAvecValeur: Story = {
  args: {
    type: 'pattern',
    format: '# # # #',
    mask: '_',
    value: '1234',
  },
};

/** Saisie OTP */
export const TypeOTP: Story = {
  args: {
    type: 'otp',
  },
};

export const TypeOTPAvecValeur: Story = {
  args: {
    type: 'otp',
    value: '123456',
  },
};

/** Saisie numéro de téléphone */
export const TypeTel: Story = {
  args: {
    type: 'tel',
  },
};

export const TypeTelAvecValeur: Story = {
  args: {
    type: 'tel',
    value: '0123456789',
  },
};

export const TypeFile: Story = {
  args: {
    type: 'file',
  },
};

export const TypeFileWithOnDrop: Story = {
  args: {
    type: 'file',
    onDropFiles: action('onDropFiles'),
  },
};

export const TypeFileWithOnDropMd: Story = {
  args: {
    type: 'file',
    displaySize: 'md',
    onDropFiles: action('onDropFiles'),
  },
};

/** Recherche en cours. */
export const TypeSearchLoading: Story = {
  args: {
    type: 'search',
    value: 'valeur recherchée',
    isLoading: true,
    onSearch: action('onSearch'),
  },
};

/** Etat désactivé */
export const AvecIconeEtDesactive: Story = {
  args: {
    disabled: true,
    placeholder: 'placeholder',
    icon: { value: 'search-line' },
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
    icon: { text: 'TTC' },
  },
};

/** Personnalisation du container (par exemple changement du padding) */
export const PersonnalisationDuContainer: Story = {
  args: { containerClassname: 'p-2', value: 'une valeur' },
};
