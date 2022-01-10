import {useState} from 'react';
import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Link} from 'react-router-dom';
import {
  InscriptionUtilisateur,
  politique_vie_privee,
  registerUser,
} from 'core-logic/api/auth/registration';
import {Spacer, ValiderButton} from 'ui/shared';
import {signInPath} from 'app/paths';

type FormState = 'ready' | 'success' | 'failure';

/**
 * The user registration form.
 */
const RegistrationForm = () => {
  const [state, setState] = useState<FormState>('ready');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (state === 'failure') {
    return (
      <main className="mx-auto max-w-2xl">
        <h1 className="text-2xl">Erreur</h1>
        <Spacer />
        <p>Le compte n'a pas pu être créé.</p>
        {errorMessage && <p>{errorMessage}</p>}
        {!errorMessage && <p>Erreur indéterminée</p>}
        <Spacer />
      </main>
    );
  } else if (state === 'success') {
    return (
      <main className="mx-auto max-w-2xl text-center">
        <Spacer />
        <div>Votre compte a bien été créé ! </div>
        <Spacer />
        <div>
          <Link to={signInPath} className="fr-btn">
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  const initialData: InscriptionUtilisateur = {
    email: '',
    nom: '',
    prenom: '',
    password: '',
    vie_privee_conditions: false,
  };

  const validation = Yup.object({
    email: Yup.string()
      .email("Cette adresse email n'est pas valide")
      .required('Champ requis'),
    nom: Yup.string()
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required('Champ requis'),
    prenom: Yup.string()
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required('Champ requis'),
    password: Yup.string()
      .min(8, 'Ce champ doit faire au minimum 8 caractères')
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required('Champ requis'),
    vie_privee_conditions: Yup.boolean().isTrue('Champ requis'),
  });

  const register = (data: InscriptionUtilisateur) => {
    registerUser(data)
      .then(_ => {
        setState('success');
      })
      .catch(reason => {
        setState('failure');
        setErrorMessage(`${reason}`);
      });
  };

  return (
    <main className="fr-container ">
      <div className="max-w-3xl pt-8 mx-auto">
        <Formik<InscriptionUtilisateur>
          initialValues={initialData}
          validationSchema={validation}
          onSubmit={register}
        >
          {() => (
            <Form>
              <div className="max-w-2xl">
                <h1 className="text-2xl">Créer un compte</h1>
                <div className="pb-10" />
                <Field
                  name="email"
                  label="Email"
                  component={LabeledTextField}
                />
                <div className="p-5" />
                <Field
                  name="password"
                  label="Mot de passe"
                  component={LabeledTextField}
                />

                <div className="p-5" />
                <Field name="nom" label="Prénom" component={LabeledTextField} />
                <div className="p-5" />
                <Field name="prenom" label="Nom" component={LabeledTextField} />
              </div>
              <div className="p-5" />
              <label>
                <Field type="checkbox" name="vie_privee_conditions" />
                <span className="ml-2">
                  J'accepte la{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className=" text-blue-600"
                    href={politique_vie_privee}
                  >
                    politique de protection des données à caractère personnel de
                    l'ADEME
                  </a>
                </span>{' '}
              </label>
              <div className="p-5" />
              <div className="max-w-2xl flex flex-row-reverse">
                <ValiderButton />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </main>
  );
};

export default RegistrationForm;
