import { Button } from '@/ui/design-system/Button';
import type { Meta, StoryObj } from '@storybook/nextjs';
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
    picto: ({ width, height, className }) => (
      <svg
        className={className}
        width={width}
        height={height}
        viewBox="0 0 24 24"
      >
        <rect width="24" height="24" rx="12" fill="#E5E7EB" />
      </svg>
    ),
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

export const WithoutPicto: Story = {
  args: {
    ...Default.args,
    picto: undefined,
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
