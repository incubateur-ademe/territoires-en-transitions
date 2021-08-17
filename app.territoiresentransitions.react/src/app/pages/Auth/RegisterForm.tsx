import {UtilisateurInscriptionInterface} from 'generated/models/utilisateur_inscription';
import React from 'react';
import {ENV} from 'environmentVariables';
import {Field, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';

const RegistrationSuccess = (props: {
  inscription: UtilisateurInscriptionInterface;
}) => {
  return (
    <>
      <h1 className="text-2xl">Votre compte</h1>
      <div className="pb-10" />
      <p>Votre compte "{props.inscription.email}" a bien été créé.</p>
      <div className="p-5" />
      <p>
        Lors de votre première connexion cliquez sur "Mot de passe oublié ?"
        afin de créer votre mot de passe.
      </p>
      <div className="p-5" />
      <div>
        <a href="/auth/signin/">Me connecter</a>
      </div>
    </>
  );
};

const RegistrationError = (props: {
  message: string;
  inscription: UtilisateurInscriptionInterface;
}) => {
  return (
    <>
      <h1 className="text-2xl">Erreur</h1>
      <div className="pb-10" />
      <p>Le compte "{props.inscription.email}" n'a pas pu être créé.</p>
      <div className="pb-5" />
      <p>{props.message}</p>
    </>
  );
};

const politique_vie_privee =
  'https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel';

const RegistrationForm = () => {
  const initialValues: UtilisateurInscriptionInterface = {
    email: '',
    nom: '',
    prenom: '',
    vie_privee_conditions: '',
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
    vie_privee_conditions: Yup.string().required('Champ requis'),
  });

  const register = async (inscription: UtilisateurInscriptionInterface) => {
    const endpoint = `${ENV.backendHost}/v2/auth/register`;

    const registrationResponse = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inscription),
    });

    const success = registrationResponse.ok;
    if (!registrationResponse.ok) {
      const contents = await registrationResponse.json();
      const error = contents['detail']['message'];
    }
  };

  return (
    <>
      <Formik<UtilisateurInscriptionInterface>
        initialValues={initialValues}
        validationSchema={validation}
        onSubmit={register}
      >
        {props => (
          <form onSubmit={props.handleSubmit}>
            <Field as={LabeledTextField} name="email" />
            <Field as={LabeledTextField} name="nom" />
            <Field as={LabeledTextField} name="prenom" />

            <button type="submit">Créer mon compte</button>
          </form>
        )}
      </Formik>
    </>
  );
};

export default RegistrationForm;
