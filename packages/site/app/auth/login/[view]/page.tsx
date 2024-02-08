'use client';
import {LoginModal, LoginView} from '@tet/ui';

/** Sous-vue pour afficher le message indiquant qu'un mail a été envoyé */
const LoginView = ({params}: {params: {view: LoginView}}) => {
  if (params?.view === 'msg_lien_envoye' || params?.view === 'msg_init_mdp') {
    return <LoginModal defaultView={params.view} />;
  }
};

export default LoginView;
