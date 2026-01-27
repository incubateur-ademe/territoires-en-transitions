import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EmptyCard } from './EmptyCard';

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

export const WithHiddenAction: Story = {
  args: {
    ...Default.args,
    title: 'Actions conditionnelles',
    subTitle: "L'action secondaire est masquée",
    actions: [
      {
        children: 'Action visible',
        onClick: () => console.log('Action visible cliquée'),
        variant: 'primary',
      },
      {
        children: 'Action masquée',
        onClick: () => console.log('Action masquée cliquée'),
        variant: 'outlined',
        isVisible: false,
      },
    ],
  },
};

export const WithAllHiddenActions: Story = {
  args: {
    ...Default.args,
    title: 'Actions conditionnelles',
    subTitle: 'Aucune action visible',
    actions: [
      {
        children: 'Action visible',
        onClick: () => console.log('Action visible cliquée'),
        variant: 'primary',
        isVisible: false,
      },
      {
        children: 'Action masquée',
        onClick: () => console.log('Action masquée cliquée'),
        variant: 'outlined',
        isVisible: false,
      },
    ],
  },
};
