import {Meta, StoryObj} from '@storybook/react';

import {NotificationButton} from './NotificationButton';
import {useRef} from 'react';

const meta: Meta<typeof NotificationButton> = {
  component: NotificationButton,
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
  },
};

export default meta;

type Story = StoryObj<typeof NotificationButton>;

/** Bouton par défaut, sans aucune props renseignée. */
export const Default: Story = {};

/** Bouton avec ref */
export const WithRef: Story = {
  render: args => {
    const buttonRef = useRef();
    const onButtonClick = () => console.log(buttonRef.current);
    return (
      <NotificationButton {...args} ref={buttonRef} onClick={onButtonClick} />
    );
  },
};
