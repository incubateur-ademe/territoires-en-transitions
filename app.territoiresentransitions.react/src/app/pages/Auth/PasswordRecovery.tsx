import {useState} from 'react';
import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import {supabaseClient} from 'core-logic/api/supabase';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Spacer} from 'ui/shared/Spacer';
import {UiDialogButton} from 'ui/UiDialogButton';
import {ErrorMessage} from 'ui/forms/ErrorMessage';

interface IPasswordRecovery {
  email: string;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Cette adresse email n'est pas valide")
    .required('Champ requis'),
});

export type TPasswordRecoveryOpts = {
  /** Valeur initiale du champ email */
  email?: string;
  /** Valeur initiale de l'état plié/déplié */
  opened?: boolean;
  /** Valeur initiale de l'état "succeed" */
  succeed?: boolean | string;
};

type TResetPwdHookReturn = [
  string,
  (args: IPasswordRecovery) => Promise<boolean | string>
];
const useResetPassword = (): TResetPwdHookReturn => {
  const [error, setError] = useState('');

  const resetPassword = ({email}: {email: string}) =>
    supabaseClient.auth.api
      .resetPasswordForEmail(email)
      .then(response => {
        if (response.error) {
          console.log(response.error?.message);
          setError("L'envoi du lien de réinitialisation a échoué");
          return false;
        }
        return email;
      })
      .catch(error => {
        console.log('resetPasswordForEmail error: ', error);
        return false;
      });

  return [error, resetPassword];
};

/**
 * Affiche un lien faisant apparaitre un champ de saisie et un bouton pour
 * envoyer par mail un code d'initialisation du mot de passe en cas d'oubli
 */
export const PasswordRecovery = ({
  email,
  opened: _opened,
  succeed: _succeed,
}: TPasswordRecoveryOpts) => {
  const [opened, setOpened] = useState(_opened || false);
  const [succeed, setSucceed] = useState<string | boolean>(_succeed || false);
  const [error, resetPassword] = useResetPassword();

  const onResetPassword = async (formValues: IPasswordRecovery) => {
    const mailSentTo = await resetPassword(formValues);
    if (mailSentTo) {
      setSucceed(mailSentTo);
    }
  };

  const PasswordRecoveryForm = () => (
    <Formik<IPasswordRecovery>
      initialValues={{email: email || ''}}
      validationSchema={validationSchema}
      onSubmit={onResetPassword}
    >
      {() => (
        <Form data-test="PasswordRecovery">
          <p>
            Nous allons vous envoyer un email, merci d’indiquer l’adresse avec
            laquelle vous avez créé votre compte Territoires en Transitions.
          </p>
          <Field
            name="email"
            label="Adresse email"
            type="text"
            component={LabeledTextField}
          />
          {error ? <ErrorMessage message={error} /> : null}
          <Spacer size={4} />
          <div className="flex justify-between">
            <button type="submit" className="fr-btn">
              Réinitialiser mon mot de passe
            </button>
            <button
              className="fr-btn fr-btn--secondary"
              onClick={e => {
                e.preventDefault();
                setOpened(false);
              }}
            >
              Retour à la connexion
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );

  const Succeed = () => (
    <div data-test="PasswordRecoverySucceed">
      <div className="fr-alert fr-alert--success">
        <p>
          Nous venons de vous envoyer un email à l’adresse {succeed} avec un
          lien pour réinitialiser votre mot de passe.
        </p>
      </div>
      <p className="mt-4">
        Si d’ici quelques minutes l’email n’est toujours pas arrivé, vérifiez
        votre dossier de messages indésirables. Nous l’avons envoyé depuis
        l’adresse noreply@mail.app.supabase.io
      </p>
      <p className="mt-4">
        Pour toute question, n’hésitez pas à nous contacter à&nbsp;
        <a href="mailto:contact@territoiresentransitions.fr">
          contact@territoiresentransitions.fr
        </a>
        &nbsp; !
      </p>
      <button
        className="mt-4 fr-btn fr-btn--secondary"
        onClick={() => setOpened(false)}
      >
        Retour à la connexion
      </button>
    </div>
  );

  return opened ? (
    <UiDialogButton
      title="Réinitialiser mon mot de passe"
      opened={opened}
      setOpened={setOpened}
    >
      {succeed ? <Succeed /> : <PasswordRecoveryForm />}
    </UiDialogButton>
  ) : (
    <button
      data-test="forgotten-pwd"
      className="fr-link text-sm"
      onClick={e => {
        e.preventDefault();
        setOpened(true);
      }}
    >
      Mot de passe oublié ?
    </button>
  );
};
