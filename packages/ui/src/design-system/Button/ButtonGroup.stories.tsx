import {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react';

import {ButtonGroup} from './ButtonGroup';

const meta: Meta<typeof ButtonGroup> = {
  component: ButtonGroup,
  args: {
    activeButtonId: '2',
    buttons: [
      {id: '1', children: 'Bouton 1'},
      {id: '2', children: 'Bouton 2'},
      {id: '3', children: 'Bouton 3'},
    ],
  },
  render: args => {
    const [activeId, setActiveId] = useState(args.activeButtonId);
    return (
      <ButtonGroup
        {...args}
        activeButtonId={activeId}
        buttons={args.buttons.map(button => ({
          ...button,
          onClick: () => setActiveId(button.id),
        }))}
      />
    );
  },
};

export default meta;

type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  args: {},
};

export const Size: Story = {
  args: {
    size: 'xs',
  },
};

export const Deux: Story = {
  args: {
    buttons: [
      {id: '1', children: 'Bouton 1'},
      {id: '2', children: 'Bouton 2'},
    ],
  },
};
