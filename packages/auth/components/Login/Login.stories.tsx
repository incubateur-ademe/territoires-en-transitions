import { action } from 'storybook/actions';
import { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Login } from './Login';
import { LoginView } from './type';

const meta: Meta<typeof Login> = {
  component: Login,
  args: {
    onCancel: action('onCancel'),
    onSubmit: action('onSubmit'),
    onOpenChatbox: action('onOpenChatbox'),
    getPasswordStrength: (...args) => {
      action('getPasswordStrength')(...args);
      return null;
    },
    defaultValues: { email: 'yolo@dodo.com', otp: '' },
  },
  render: (props) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [view, setView] = useState<LoginView>(props.view || 'etape1');
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

export const MsgLienEnvoye: Story = {
  args: { view: 'msg_lien_envoye' },
};

export const AvecErreur: Story = {
  args: { error: 'Une erreur est survenue...' },
};

export const MotDePasseOublie: Story = {
  args: { view: 'mdp_oublie' },
};

export const MsgInitMdp: Story = {
  args: { view: 'msg_init_mdp' },
};

export const Recover: Story = {
  args: { view: 'recover' },
};

export const ReinitMotDePasse: Story = {
  args: { view: 'reset_mdp' },
};
