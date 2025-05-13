import { Button } from '@/ui/design-system/Button';
import type { Meta, StoryObj } from '@storybook/react';
import { EmptyCard } from './EmptyCard';

const DemoIcon = (
  className: string,
  size: { width: string; height: string }
) => (
  <svg
    className={className}
    width={size.width}
    height={size.height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="12" fill="#E5E7EB" />
  </svg>
);

const DemoBadges = () => (
  <div className="flex gap-2">
    {['Badge 1', 'Badge 2'].map((badge) => (
      <span key={badge} className="px-2 py-1 bg-grey-2 rounded">
        {badge}
      </span>
    ))}
  </div>
);

const meta = {
  title: 'Components/EmptyCard',
  component: EmptyCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyCard>;

export default meta;
type Story = StoryObj<typeof EmptyCard>;

export const Default: Story = {
  args: {
    picto: (props) =>
      DemoIcon(props.className ?? '', {
        width: props.width ?? '24',
        height: props.height ?? '24',
      }),
    title: 'Titre de la carte vide',
    subTitle: 'Sous-titre optionnel',
    description:
      'Description optionnelle qui explique plus en détail le contexte',
    variant: 'primary',
    size: 'md',
    actions: [
      {
        children: 'Action principale',
        onClick: () => console.log('Action principale cliquée'),
        variant: 'primary',
      },
      {
        children: 'Action secondaire',
        onClick: () => console.log('Action secondaire cliquée'),
        variant: 'outlined',
      },
    ],
  },
};

export const Small: Story = {
  args: {
    ...Default.args,
    size: 'xs',
  },
};

export const Medium: Story = {
  args: {
    ...Default.args,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    size: 'xl',
  },
};

export const ReadOnly: Story = {
  args: {
    ...Default.args,
    isReadonly: true,
  },
};

export const Transparent: Story = {
  args: {
    ...Default.args,
    variant: 'transparent',
  },
};

export const WithCustomButton: Story = {
  args: {
    ...Default.args,
    actions: [
      <Button
        key="custom-button"
        variant="outlined"
        onClick={() => console.log('Custom button clicked')}
      >
        Bouton d'action secondaire
      </Button>,
      <Button
        key="custom-button"
        variant="primary"
        onClick={() => console.log('Custom button clicked')}
      >
        Bouton d'action principale
      </Button>,
    ],
  },
};
