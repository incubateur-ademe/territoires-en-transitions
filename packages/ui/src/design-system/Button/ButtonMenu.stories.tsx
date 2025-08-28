import { Meta, StoryObj } from '@storybook/nextjs';

import { useState } from 'react';
import { ButtonMenu } from './ButtonMenu';

const meta: Meta<typeof ButtonMenu> = {
  component: ButtonMenu,
  args: {
    icon: 'equalizer-fill',
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

type Story = StoryObj<typeof ButtonMenu>;

export const Default: Story = {
  render: (args) => {
    return (
      <div className="flex gap-24 justify-between mb-52">
        <ButtonMenu {...args} menuPlacement="bottom-start" />
        <ButtonMenu {...args} notification={{ number: 2 }} />
      </div>
    );
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="mb-52">
        <ButtonMenu
          {...args}
          menuPlacement="bottom-start"
          openState={{
            isOpen,
            setIsOpen,
          }}
        />
      </div>
    );
  },
};

export const WithArrow: Story = {
  render: (args) => {
    return (
      // <div className="flex gap-24 justify-between mb-52">
      // </div>
      <ButtonMenu {...args} text="Button Menu" withArrow />
    );
  },
};
