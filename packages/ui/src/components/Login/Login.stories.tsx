import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {Login} from './Login';

const meta: Meta<typeof Login> = {
  component: Login,
  args: {
    onSubmit: action('onSubmit'),
  },
};

export default meta;

type Story = StoryObj<typeof Login>;

export const Default: Story = {
  args: {},
};

export const AvecMotDePasse: Story = {
  args: {defaultView: 'par_mdp'},
};

export const MotDePasseOublie: Story = {
  args: {defaultView: 'mdp_oublie'},
};

export const MsgLienEnvoye: Story = {
  args: {defaultView: 'msg_lien_envoye'},
};

export const MsgInitMdp: Story = {
  args: {defaultView: 'msg_init_mdp'},
};
