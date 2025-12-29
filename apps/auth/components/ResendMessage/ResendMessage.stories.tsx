import {Meta, StoryObj} from '@storybook/nextjs-vite';
import {action} from 'storybook/actions';
import {ResendMessage} from './ResendMessage';

const meta: Meta<typeof ResendMessage> = {
  component: ResendMessage,
  args: {
    email: 'yolo@dodo.com',
    type: 'login',
    onResend: action('onResend'),
  },
};

export default meta;

type Story = StoryObj<typeof ResendMessage>;

export const Default: Story = {};

export const Opened: Story = {
  args: {
    isOpened: true,
  },
};

export const Loading: Story = {
  args: {
    isOpened: true,
    isLoading: true,
  },
};
