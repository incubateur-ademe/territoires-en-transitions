import { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ButtonSize, ButtonVariant } from './types';
import { SplitButton } from './split-button';

const menuActions = [
  {
    icon: 'import-line',
    label: 'Importer un plan',
    onClick: () => console.log('Importer'),
  },
  {
    icon: 'file-copy-line',
    label: 'Dupliquer un plan existant',
    onClick: () => console.log('Dupliquer'),
  },
];

const meta: Meta<typeof SplitButton> = {
  component: SplitButton,
  argTypes: {
    variant: {
      control: { type: 'select' },
    },
    size: {
      control: { type: 'select' },
    },
    icon: {
      control: { type: 'text' },
    },
  },
  args: {
    children: 'Créer un plan',
    icon: 'add-line',
    size: 'sm',
    onClick: () => console.log('Action principale'),
    menuActions,
  },
};

export default meta;

type Story = StoryObj<typeof SplitButton>;

/** Bouton scindé par défaut : `variant` et `size` se règlent dans les contrôles. */
export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Le bouton-icône s'aligne sur la hauteur de l'action principale, à chaque taille. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-5">
      {(['xs', 'sm', 'md', 'xl'] as ButtonSize[]).map((size) => (
        <SplitButton key={size} {...args} size={size}>
          {size}
        </SplitButton>
      ))}
    </div>
  ),
};

/**
 * Les variantes en aplat portent un trait de séparation ; les variantes
 * détourées se contentent de leurs bordures. `underlined` et `unstyled` n'ont
 * ni fond ni rayon : le bouton scindé n'a pas de sens pour elles.
 */
export const Variants: Story = {
  render: (args) => {
    const variants: ButtonVariant[] = [
      'primary',
      'secondary',
      'outlined',
      'white',
      'grey',
    ];
    return (
      <div className="flex flex-col gap-5 bg-grey-2 p-10">
        <div className="flex flex-wrap items-end gap-5">
          {variants.map((variant) => (
            <SplitButton key={variant} {...args} variant={variant}>
              {variant}
            </SplitButton>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-5">
          {variants.map((variant) => (
            <SplitButton key={variant} {...args} variant={variant} disabled>
              {variant}
            </SplitButton>
          ))}
        </div>
      </div>
    );
  },
};
