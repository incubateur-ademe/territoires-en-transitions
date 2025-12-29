import {useState} from 'react';
import {Meta, StoryObj} from '@storybook/nextjs-vite';

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

export const Variant: Story = {
  args: {
    variant: 'neutral',
  },
};

export const Size: Story = {
  args: {
    size: 'xs',
  },
};

export const Disabled: Story = {
  args: {
    buttons: [
      {id: '1', children: 'Bouton 1', icon: 'leaf-line', disabled: true},
      {id: '2', children: 'Bouton 2', icon: 'leaf-line'},
      {id: '3', children: 'Bouton 3', icon: 'leaf-line'},
    ],
  },
  render: props => {
    const [activeId, setActiveId] = useState(props.activeButtonId);
    return (
      <div className="w-[40rem] m-12 p-12 flex flex-col gap-6 border border-primary-5 rounded-xl">
        <p>Primary</p>
        <ButtonGroup
          {...props}
          fillContainer
          activeButtonId={activeId}
          buttons={props.buttons.map(button => ({
            ...button,
            onClick: () => setActiveId(button.id),
          }))}
        />
        <ButtonGroup {...props} fillContainer activeButtonId="1" />
        <p>Neutral</p>
        <ButtonGroup
          {...props}
          variant="neutral"
          fillContainer
          activeButtonId={activeId}
          buttons={props.buttons.map(button => ({
            ...button,
            onClick: () => setActiveId(button.id),
          }))}
        />
        <ButtonGroup
          {...props}
          variant="neutral"
          fillContainer
          activeButtonId="1"
        />
      </div>
    );
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

export const FillContainerSize: Story = {
  args: {
    buttons: [
      {id: '1', children: 'Bouton 1', icon: 'leaf-line', disabled: false},
      {
        id: '2',
        children: 'Bouton avec plus de texte 2',
        icon: 'leaf-line',
        disabled: false,
      },
    ],
  },
  render: props => (
    <div className="w-[32rem] m-12 p-12 border border-primary-5 rounded-xl">
      <div className="flex bg-primary-2">
        <ButtonGroup {...props} fillContainer />
      </div>
    </div>
  ),
};
