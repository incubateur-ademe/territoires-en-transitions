import { Meta, StoryObj } from '@storybook/nextjs';

import { ActionsMenu } from './ActionsMenu';

const meta: Meta<typeof ActionsMenu> = {
  component: ActionsMenu,
};

export default meta;

type Story = StoryObj<typeof ActionsMenu>;

export const Default: Story = {
  args: {
    actions: [
      {
        icon: 'edit-line',
        label: 'Action 1',
        onClick: () => {
          console.log('Action 1');
        },
      },
      {
        icon: 'download-line',
        label: 'Action 2',
        onClick: () => {
          console.log('Action 2');
        },
      },
    ],
  },
};
