import { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ComponentProps, useState } from 'react';
import { DEPRECATED_ButtonMenu } from './DEPRECATED_ButtonMenu';

const meta: Meta<typeof DEPRECATED_ButtonMenu> = {
  component: DEPRECATED_ButtonMenu,
  args: {
    icon: 'menu-2-line',
    variant: 'grey',
    children: (
      <div className="!w-44 text-sm">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium,
        dicta natus, ea voluptates enim nobis aspernatur vero debitis
        repellendus cum temporibus, praesentium neque dolore.
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof DEPRECATED_ButtonMenu>;

export const Default: Story = {
  render: (args) => {
    return (
      <div className="flex gap-24 justify-between mb-52">
        <DEPRECATED_ButtonMenu {...args} menuPlacement="bottom-start" />
        <DEPRECATED_ButtonMenu {...args} notification={{ number: 2 }} />
      </div>
    );
  },
};

const RenderControlled = (
  args: ComponentProps<typeof DEPRECATED_ButtonMenu>
) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-52">
      <DEPRECATED_ButtonMenu
        {...args}
        menuPlacement="bottom-start"
        openState={{
          isOpen,
          setIsOpen,
        }}
      />
    </div>
  );
};

export const Controlled: Story = {
  render: (args) => <RenderControlled {...args} />,
};

export const WithArrow: Story = {
  render: (args) => {
    return (
      // <div className="flex gap-24 justify-between mb-52">
      // </div>
      <DEPRECATED_ButtonMenu {...args} text="Button Menu" withArrow />
    );
  },
};
