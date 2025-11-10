import { Meta, StoryObj } from '@storybook/nextjs';

import { ButtonMenu } from './ActionsMenu';

const meta: Meta<typeof ButtonMenu> = {
  component: ButtonMenu,
};

export default meta;

type Story = StoryObj<typeof ButtonMenu>;

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
