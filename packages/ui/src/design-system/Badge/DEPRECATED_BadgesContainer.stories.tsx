import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge, DEPRECATED_BadgesContainer } from './index';

const meta: Meta<typeof DEPRECATED_BadgesContainer> = {
  component: DEPRECATED_BadgesContainer,
};

export default meta;

type Story = StoryObj<typeof DEPRECATED_BadgesContainer>;

export const Default: Story = {
  args: {
    badges: ['Badge1', 'Badge2', 'Badge3'],
    badgeProps: { state: 'standard', size: 'sm', trim: false },
  },
};

export const WithClearButton: Story = {
  args: {
    badges: ['Badge1', 'Badge2', 'Badge3'],
    badgeProps: { state: 'standard', size: 'sm', trim: false },
    endButtonBadge: (
      <Badge
        title="Supprimer tous les filtres"
        icon="delete-bin-6-line"
        iconPosition="left"
        state="default"
      />
    ),
  },
};

export const WithClearButtonAndMaxDisplayed: Story = {
  args: {
    badges: ['Badge1', 'Badge2', 'Badge3', 'Badge4', 'Badge5'],
    badgeProps: { state: 'standard', size: 'sm', trim: false },
    maxDisplayedBadge: { count: 2, label: 'filtre(s)' },
    endButtonBadge: (
      <Badge
        title="Supprimer tous les filtres"
        icon="delete-bin-6-line"
        iconPosition="left"
        state="default"
      />
    ),
  },
};
