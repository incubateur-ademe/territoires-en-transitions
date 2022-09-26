import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {ValiderButton} from 'ui/shared/ValiderButton';
import {Spacer} from 'ui/shared/Spacer';
import {Link} from 'react-router-dom';
import {signUpPath} from 'app/paths';
import {ErrorMessage} from 'ui/forms/ErrorMessage';
import {PasswordRecovery} from './PasswordRecovery';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

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
  const {connect, authError} = useAuth();

  return (
    <section data-test="SignInPage" className="max-w-xl mx-auto p-5">
      <Spacer />
      <h2 className="fr-h2 flex justify-center">Se connecter</h2>
      <div className="mx-auto">
        <Formik<SignInCredentials>
          initialValues={{email: '', password: ''}}
          validationSchema={validation}
          onSubmit={credentials => {
            connect(credentials);
          }}
        >
          {({values}) => (
            <Form>
              <Field
                name="email"
                label="Email"
                type="text"
                component={LabeledTextField}
              />
              <Spacer size={2} />
              <Field
                name="password"
                label="Mot de passe"
                type="password"
                component={LabeledTextField}
              />
              <Spacer size={2} />
              <PasswordRecovery email={values.email} />
              <Spacer size={4} />
              <AuthError message={authError} />
              <div className="flex flex-row-reverse justify-between">
                <ValiderButton />
                <Link className="fr-link" to={signUpPath}>
                  Créer un compte
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </section>
  );
};

const AuthError = ({message}: {message: string | null}) =>
  message !== null ? <ErrorMessage message={message} /> : null;
