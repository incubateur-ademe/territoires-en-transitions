import {Button} from '@design-system/Button';
import {
  ModalFooter,
  ModalFooterOKCancel,
  ModalFooterSection,
} from '@design-system/Modal';
import {LoginPropsWithState} from './type';
import {InputEmail} from './InputEmail';
import {FieldMessage} from '@design-system/Field';

/** Demande de réinitialisation du mot de passe */
export const ForgottenPassword = (props: LoginPropsWithState) => {
  const {error, isLoading, loginState, setView, onCancel} = props;
  const {
    contactSupport,
    onSubmitForm,
    form: {
      formState: {isValid},
    },
  } = loginState;

  return (
    <>
      <InputEmail
        loginState={loginState}
        infoMessage="Vous devez être en mesure d'accéder à cette boîte mail pour ouvrir l'e-mail avec le nouveau mot de passe sinon contacter le support."
      />
      <Button
        variant="underlined"
        onClick={e => {
          e.preventDefault();
          contactSupport();
        }}
      >
        Contactez le support !
      </Button>
      {error && (
        <FieldMessage messageClassName="mt-4" state="error" message={error} />
      )}
      <ModalFooter variant="space">
        <Button
          variant="outlined"
          icon="arrow-left-line"
          iconPosition="left"
          onClick={() => setView('par_mdp')}
        >
          Se connecter
        </Button>
        <ModalFooterSection>
          <ModalFooterOKCancel
            btnOKProps={{
              onClick: onSubmitForm,
              disabled: !isValid || isLoading,
            }}
            btnCancelProps={{onClick: onCancel}}
          />
        </ModalFooterSection>
      </ModalFooter>
    </>
  );
};
