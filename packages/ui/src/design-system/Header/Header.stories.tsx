import { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';
import { Button } from '@tet/ui/design-system/Button';
import { APP_BASE_URL } from '@tet/ui/utils/constants';

const meta: Meta<typeof Header> = {
  component: Header,
  args: {
    logos: [<i className="ri-leaf-line text-primary-9 !text-8xl" />],
    title: 'Lorem ipsum',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    quickAccessButtons: (props) => [
      <Button {...props} icon="user-line" href={`${APP_BASE_URL}/auth/signin`}>
        Se connecter
      </Button>,
    ],
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {};
