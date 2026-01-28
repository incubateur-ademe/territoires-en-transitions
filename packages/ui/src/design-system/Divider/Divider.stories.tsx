import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  component: Divider,
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Theme: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <span>Titre 1</span>
      <Divider color="grey" />
      <span>Titre 2</span>
      <Divider color="primary" />
      <span>Titre 3</span>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex items-center gap-6 h-6">
      <span>Titre 1</span>
      <Divider orientation="vertical" />
      <span>Titre 2</span>
      <Divider orientation="vertical" />
      <span>Titre 3</span>
    </div>
  ),
};
