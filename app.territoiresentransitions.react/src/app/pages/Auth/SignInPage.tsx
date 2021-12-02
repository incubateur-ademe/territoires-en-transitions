import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Spacer, ValiderButton} from 'ui/shared';
import {authBloc} from 'core-logic/observables/authBloc';

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
      <h1 className="fr-h1">Se connecter</h1>
      <div className=" pt-8 mx-auto">
        <Formik<SignInCredentials>
          initialValues={{email: '', password: ''}}
          validationSchema={validation}
          onSubmit={credentials => {
            authBloc.connect(credentials);
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
              <ValiderButton />
            </Form>
          )}
        </Formik>
      </div>
    </section>
  );
};
