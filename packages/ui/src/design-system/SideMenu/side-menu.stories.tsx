import { Meta, StoryObj } from '@storybook/nextjs';
import { SideMenu } from './side-menu';

const meta: Meta<typeof SideMenu> = {
  component: SideMenu,
  args: {
    children: (
      <div className="flex flex-col justify-center h-full">
        <div className="text-center">Side menu content</div>
      </div>
    ),
    headerType: 'title',
    title: 'Side menu',
    count: 2,
    isOpen: true,
  },
};

export default meta;

type Story = StoryObj<typeof SideMenu>;

export const Default: Story = {};
