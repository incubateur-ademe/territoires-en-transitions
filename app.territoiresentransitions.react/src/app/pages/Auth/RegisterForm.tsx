import React, {useState} from 'react';
import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Link} from 'react-router-dom';
import {
  InscriptionUtilisateur,
  politique_vie_privee,
  registerUser,
} from 'core-logic/api/auth/registration';

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
        <div className="pb-10" />
        <p>Le compte n'a pas pu être créé.</p>
        {errorMessage && <p>{errorMessage}</p>}
        {!errorMessage && <p>Erreur indéterminée</p>}
        <div className="pb-5" />
      </main>
    );
  } else if (state === 'success') {
    return (
      <main className="mx-auto max-w-2xl">
        <h1 className="text-2xl">Votre compte</h1>
        <div className="pb-10" />
        <p>Votre compte a bien été créé.</p>
        <div className="p-5" />
        <p>
          Lors de votre première connexion cliquez sur "Mot de passe oublié ?"
          afin de créer votre mot de passe.
        </p>
        <div className="p-5" />
        <div>
          <Link to="/auth/signin/" className="fr-btn">
            Me connecter
          </Link>
        </div>
      </main>
    );
  }

  const initialData: InscriptionUtilisateur = {
    email: '',
    nom: '',
    prenom: '',
    mot_de_passe: '',
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
    mot_de_passe: Yup.string()
      .min(8, 'Ce champ doit faire au minimum 8 caractères')
      .max(300, 'Ce champ doit faire au maximum 300 caractères')
      .required('Champ requis'),
    vie_privee_conditions: Yup.boolean().isTrue('Champ requis'),
  });

  const register = (data: InscriptionUtilisateur) => {
    registerUser(data)
      .catch(reason => {
        setState('failure');
        setErrorMessage(`${reason}`);
      })
      .then(_ => {
        setState('success');
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
                  name="mot_de_passe"
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
                </span>
              </label>
              <div className="p-5" />
              <div className="max-w-2xl flex flex-row-reverse">
                <button type="submit" className="fr-btn">
                  Envoyer
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </main>
  );
};

export default RegistrationForm;
