import {Tab, Tabs} from '@design-system/Tabs';
import {ModalFooterOKCancel} from '@design-system/Modal';
import {LoginProps} from './type';
import {useLoginState} from './useLoginState';
import {ForgottenPassword} from './ForgottenPassword';
import {InputEmail} from './InputEmail';
import {MailSendMessage} from './MailSendMessage';
import {LoginWithPassword} from './LoginWithPassword';

/**
 * Affiche le panneau d'authentification et le formulaire "mot de passe oublié"
 */
export const Login = (props: LoginProps) => {
  const {onCancel, isLoading, view, setView} = props;
  const loginState = useLoginState(props);
  const {
    onSubmitForm,
    form: {
      formState: {isValid},
    },
  } = loginState;

  if (view === 'msg_lien_envoye') {
    return (
      <MailSendMessage
        message1="Pour vous connecter, veuillez consultez votre boite mail et"
        message2="cliquer sur le lien sécurisé reçu !"
      />
    );
  }

  if (view === 'msg_init_mdp') {
    return (
      <MailSendMessage
        message1="Veuillez consultez votre boite mail pour"
        message2="réinitialiser votre mot de passe."
      />
    );
  }

  const title =
    view === 'mdp_oublie' ? 'Mot de passe oublié ? ' : 'Se connecter';

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmitForm}>
      <h3 className="self-center">{title}</h3>
      {view === 'mdp_oublie' ? (
        <ForgottenPassword {...props} loginState={loginState} />
      ) : (
        <>
          <Tabs
            className="justify-center"
            defaultActiveTab={view === 'par_lien' ? 0 : 1}
            onChange={activeTab => {
              setView(activeTab === 0 ? 'par_lien' : 'par_mdp');
            }}
          >
            <Tab label="Connexion sans mot de passe">
              <InputEmail
                loginState={loginState}
                infoMessage="La connexion se fait par lien sécurisé envoyé sur votre boite mail."
              />
            </Tab>
            <Tab label="Connexion avec mot de passe">
              <LoginWithPassword {...props} loginState={loginState} />
            </Tab>
          </Tabs>
          <ModalFooterOKCancel
            btnOKProps={{
              onClick: onSubmitForm,
              disabled: !isValid || isLoading,
            }}
            btnCancelProps={{onClick: onCancel}}
          />
        </>
      )}
    </form>
  );
};
