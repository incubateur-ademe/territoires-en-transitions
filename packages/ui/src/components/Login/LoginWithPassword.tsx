import {Field} from '@design-system/Field';
import {Input} from '@design-system/Input';
import {Button} from '@design-system/Button';
import {FormSectionGrid} from '@design-system/FormSection';
import {InputEmail} from './InputEmail';
import {LoginPropsWithState} from './type';

/**
 * Affiche le formulaire de connexion avec mot de passe
 */
export const LoginWithPassword = ({
  loginState,
  setView,
}: LoginPropsWithState) => {
  const {passwordProps} = loginState;

  return (
    <FormSectionGrid>
      <InputEmail loginState={loginState} />
      <Field
        className="mb-6 md:col-span-2"
        title="Mot de passe"
        htmlFor="password"
      >
        <Input type="password" {...passwordProps} id="password" />
      </Field>
      <Button
        data-test="forgotten-pwd"
        variant="underlined"
        onClick={e => {
          e.preventDefault();
          setView('mdp_oublie');
        }}
      >
        Mot de passe oublié ?
      </Button>
    </FormSectionGrid>
  );
};
