import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Spacer, ValiderButton} from 'ui/shared';
import {authBloc} from 'core-logic/observables/authBloc';
import {RegisterLink} from 'ui/shared/Links';

export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 */
export const SignInPage = () => {
  const validation = Yup.object({
    email: Yup.string()
      .email("Cette adresse email n'est pas valide")
      .required('Champ requis'),
    password: Yup.string().required('Champ requis'),
  });

  return (
    <section className="max-w-2xl mx-auto p-5">
      <Spacer />
      <h2 className="fr-h2 flex justify-center">Se connecter</h2>
      <div className="mx-auto">
        <Formik<SignInCredentials>
          initialValues={{email: '', password: ''}}
          validationSchema={validation}
          onSubmit={credentials => {
            authBloc.connect(credentials);
            console.log(authBloc.connected);
          }}
        >
          {() => (
            <Form>
              <Field name="email" label="Email" component={LabeledTextField} />
              <div className="p-5" />
              <Field
                name="password"
                label="Mot de passe"
                component={LabeledTextField}
              />
              <Spacer />
              <div className="flex flex-row-reverse gap-3">
                <ValiderButton />
                <RegisterLink />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </section>
  );
};
