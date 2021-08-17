import {UtilisateurInscriptionInterface} from 'generated/models/utilisateur_inscription';
import React, {useState} from 'react';
import {ENV} from 'environmentVariables';
import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Link} from 'react-router-dom';

const politique_vie_privee =
  'https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel';

export interface InscriptionFormData {
  email: string;
  nom: string;
  prenom: string;
  vie_privee_conditions: boolean;
}

type FormState = 'ready' | 'success' | 'failure';

const RegistrationForm = () => {
  const [state, setState] = useState<FormState>('ready');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (state === 'failure') {
    return (
      <>
        <h1 className="text-2xl">Erreur</h1>
        <div className="pb-10" />
        <p>Le compte n'a pas pu être créé.</p>
        {errorMessage && <p>{errorMessage}</p>}
        {!errorMessage && <p>Erreur indéterminée</p>}
        <div className="pb-5" />
      </>
    );
  } else if (state === 'success') {
    return (
      <>
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
      </>
    );
  }

  const initialData: InscriptionFormData = {
    email: '',
    nom: '',
    prenom: '',
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
    vie_privee_conditions: Yup.boolean().isTrue('Champ requis'),
  });

  const register = (data: InscriptionFormData) => {
    const endpoint = `${ENV.backendHost}/v2/auth/register`;
    const inscription: UtilisateurInscriptionInterface = {
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      vie_privee_conditions: data.vie_privee_conditions
        ? politique_vie_privee
        : '',
    };
    fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inscription),
    })
      .catch(reason => {
        setState('failure');
        setErrorMessage(`${reason}`);
      })
      .then(async response => {
        if (response) {
          setState(response.ok ? 'success' : 'failure');
          if (!response.ok) {
            const contents = await response.json();
            setErrorMessage(contents['detail']['message']);
          }
        } else {
          setState('failure');
        }
      });
  };

  return (
    <Formik<InscriptionFormData>
      initialValues={initialData}
      validationSchema={validation}
      onSubmit={register}
    >
      {() => (
        <Form>
          <h1 className="text-2xl">Créer un compte</h1>
          <div className="pb-10" />
          <Field name="email" label="Email" component={LabeledTextField} />
          <div className="p-5" />
          <Field name="nom" label="Prénom" component={LabeledTextField} />
          <div className="p-5" />
          <Field name="prenom" label="Nom" component={LabeledTextField} />
          <div className="p-5" />
          <label>
            <Field type="checkbox" name="vie_privee_conditions" />
            {`${politique_vie_privee}`}
          </label>
          <div className="p-5" />
          <button type="submit">Submit</button>
        </Form>
      )}
    </Formik>
  );
};

export default RegistrationForm;
