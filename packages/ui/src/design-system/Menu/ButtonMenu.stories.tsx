import {Meta, StoryObj} from '@storybook/react';
import {ButtonMenu} from './ButtonMenu';

const meta: Meta<typeof ButtonMenu> = {
  component: ButtonMenu,
  argTypes: {
    notificationVariant: {
      control: {type: 'select'},
    },
    variant: {
      control: {type: 'select'},
    },
    size: {
      control: {type: 'select'},
    },
    icon: {
      control: {type: 'text'},
    },
    iconPosition: {
      control: {type: 'select'},
    },
  },
  args: {
    icon: 'leaf-line',
    notificationValue: 2,
    menuAlignment: 'left',
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
  render: args => {
    return (
      <div className="mb-52">
        <ButtonMenu {...args} />
      </div>
    );
  },
};
