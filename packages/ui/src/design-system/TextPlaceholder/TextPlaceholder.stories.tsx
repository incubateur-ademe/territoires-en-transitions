import { Meta, StoryObj } from '@storybook/nextjs';
import { TextPlaceholder } from './TextPlaceholder';

const meta: Meta<typeof TextPlaceholder> = {
  component: TextPlaceholder,
};

export default meta;

type Story = StoryObj<typeof TextPlaceholder>;

export const Default: Story = {};
