import {useState} from 'react';
import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {Login} from './Login';
import {LoginView} from './type';

const meta: Meta<typeof Login> = {
  component: Login,
  args: {
    onCancel: action('onCancel'),
    onSubmit: action('onSubmit'),
  },
  render: props => {
    const [view, setView] = useState<LoginView>(props.view || 'par_lien');
    const onSetView: typeof setView = (...args) => {
      action('setView')(...args);
      setView(...args);
    };
    return <Login {...props} view={view} setView={onSetView} />;
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

export const AvecErreur: Story = {
  args: {view: 'par_mdp', error: 'Une erreur est survenue...'},
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
