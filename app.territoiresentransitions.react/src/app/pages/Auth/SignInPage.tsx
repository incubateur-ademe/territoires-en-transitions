import {Field, Form, Formik} from 'formik';
import {signIn, SignInCredentials} from 'core-logic/api/auth/signIn';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';

/**
 */
export const SignInPage = () => {
  const validation = Yup.object({
    email: Yup.string()
      .email("Cette adresse email n'est pas valide")
      .required('Champ requis'),
    mot_de_passe: Yup.string().required('Champ requis'),
  });

  return (
    <main className="fr-container ">
      <h1 className="fr-h1">Se connecter</h1>
      <div className="max-w-3xl pt-8 mx-auto">
        <Formik<SignInCredentials>
          initialValues={{email: '', mot_de_passe: ''}}
          validationSchema={validation}
          onSubmit={signIn}
        >
          {() => (
            <Form>
              <Field name="email" label="Email" component={LabeledTextField} />
              <div className="p-5" />
              <Field
                name="mot_de_passe"
                label="Mot de passe"
                component={LabeledTextField}
              />
              <div className="max-w-2xl flex flex-row-reverse">
                <button type="submit" className="fr-btn">
                  Ok
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </main>
  );
};
