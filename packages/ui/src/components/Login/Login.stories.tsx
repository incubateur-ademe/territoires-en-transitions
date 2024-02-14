import {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {Login} from './Login';
import {LoginView} from './type';

const meta: Meta<typeof Login> = {
  component: Login,
  args: {
    onSubmit: action('onSubmit'),
  },
  render: args => {
    const [view, setView] = useState<LoginView>(args.view || 'par_lien');
    return <Login {...args} view={view} setView={setView} />;
  },
};

export default meta;

type Story = StoryObj<typeof Login>;

export const Default: Story = {
  args: {},
};

export const AvecMotDePasse: Story = {
  args: {view: 'par_mdp'},
};

export const MotDePasseOublie: Story = {
  args: {view: 'mdp_oublie'},
};

export const MsgLienEnvoye: Story = {
  args: {view: 'msg_lien_envoye'},
};

export const MsgInitMdp: Story = {
  args: {view: 'msg_init_mdp'},
};
