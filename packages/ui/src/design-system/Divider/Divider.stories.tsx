import {Meta, StoryObj} from '@storybook/nextjs';
import {Divider} from './Divider';

const meta: Meta<typeof Divider> = {
  component: Divider,
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {};
