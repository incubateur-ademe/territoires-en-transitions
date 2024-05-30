import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {Invite} from './Invite';

const meta: Meta<typeof Invite> = {
  component: Invite,
  args: {
    onCancel: action('onCancel'),
    onSubmit: action('onSubmit'),
  },
};

export default meta;

type Story = StoryObj<typeof Invite>;

export const ModeEdition: Story = {
  args: {niveauAcces: 'edition'},
};

export const ModeAdmin: Story = {
  args: {niveauAcces: 'admin'},
};
