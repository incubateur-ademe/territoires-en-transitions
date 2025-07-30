import { Button } from '@/ui/design-system/Button';
import { APP_BASE_URL } from '@/ui/utils/constants';
import { Meta, StoryObj } from '@storybook/nextjs';
import { Header } from './Header';

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
