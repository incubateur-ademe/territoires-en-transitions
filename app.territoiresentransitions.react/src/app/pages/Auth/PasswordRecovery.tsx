import {useState} from 'react';
import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import {AuthBloc, authBloc} from 'core-logic/observables/authBloc';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {ValiderButton} from 'ui/shared/ValiderButton';
import {Spacer} from 'ui/shared/Spacer';
import {UiDialogButton} from 'ui/UiDialogButton';
import {observer} from 'mobx-react-lite';
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
  /**  */
  bloc: AuthBloc;
};

/**
 * Affiche un lien faisant apparaitre un champ de saisie et un bouton pour
 * envoyer par mail un code d'initialisation du mot de passe en cas d'oubli
 */
export const PasswordRecovery = ({
  email,
  opened: _opened,
  bloc,
}: TPasswordRecoveryOpts) => {
  const [opened, setOpened] = useState(_opened || false);

  return opened ? (
    <UiDialogButton
      title="Réinitialisation du mot de passe"
      opened={opened}
      setOpened={setOpened}
    >
      <Formik<IPasswordRecovery>
        initialValues={{email: email || ''}}
        validationSchema={validationSchema}
        onSubmit={formValues => authBloc.resetPasswordForEmail(formValues)}
      >
        {() => (
          <Form data-test="PasswordRecovery">
            <Field
              name="email"
              label="Un lien de réinitialisation de votre mot de passe va être envoyé à l'adresse ci-dessous"
              type="text"
              component={LabeledTextField}
            />
            <AuthError bloc={bloc} />
            <Spacer size={4} />
            <div className="flex justify-between">
              <button
                className="fr-link"
                onClick={e => {
                  e.preventDefault();
                  setOpened(false);
                }}
              >
                Annuler
              </button>
              <ValiderButton />
            </div>
          </Form>
        )}
      </Formik>
    </UiDialogButton>
  ) : (
    <a
      data-test="forgotten-pwd"
      className="fr-link text-sm"
      href="#"
      onClick={e => {
        e.preventDefault();
        setOpened(true);
      }}
    >
      Mot de passe oublié ?
    </a>
  );
};

const AuthError = observer(({bloc}: {bloc: AuthBloc}) =>
  bloc.authError !== null ? <ErrorMessage message={bloc.authError} /> : null
);
