import {UtilisateurInscriptionInterface} from 'generated/models/utilisateur_inscription';
import React from 'react';
import {ENV} from 'environmentVariables';
import {Formik} from 'formik';
import * as Yup from 'yup';

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

  // <h1 className="text-2xl">Créer un compte</h1>
  // <div className="pb-10"/>
  // <div>Si vous avez déjà un compte ADEME, <a className="text-blue-600" href="/auth/signin/">connectez-vous
  //   directement
  //   par ici</a>.
  // </div>
  // <div className="p-5"/>
  // <form className="flex flex-col w-full md:w-3/4 pb-10">
  //   <div>Tous les champs sont obligatoires.</div>
  //   <div className="p-5"/>
  //   <LabeledTextInput initialValue={inscription.nom}
  //                     validateOnMount={false}
  //                     maxlength={300}
  //                     validator={validators.nom}>
  //     <div className="text-xl">Nom</div>
  //   </LabeledTextInput>
  //   <div className="p-5"/>
  //
  //   <LabeledTextInput initialValue={inscription.prenom}
  //                     validateOnMount={false}
  //                     maxlength={300}
  //                     validator={validators.prenom}>
  //     <div className="text-xl">Prénom</div>
  //   </LabeledTextInput>
  //   <div className="p-5"/>
  //
  //   <LabeledTextInput initialValue={inscription.email}
  //                     validateOnMount={false}
  //                     maxlength={300}
  //                     validator={validators.email}>
  //     <div className="text-xl">Adresse mail</div>
  //   </LabeledTextInput>
  //   <div className="p-5"/>
  //
  //
  //   <label className="inline-flex items-center">
  //     <input type="checkbox"
  //            className="form-checkbox"/>
  //     <span className="ml-2">
  //                 J'accepte la <a target="_blank" rel="noopener noreferrer" className="underline text-blue-600"
  //                                 href={politique_vie_privee}>politique de protection
  //                 des données à caractère personnel de l'ADEME</a>
  //             </span>
  //   </label>
  //   <div className="p-5"/>
  //
  //   <button className="fr-btn" onClick={register}>
  //     Créer mon compte
  //   </button>
  // </form>
  return (
    <>
      <Formik<UtilisateurInscriptionInterface>
        initialValues={initialValues}
        validationSchema={validation}
        onSubmit={register}
      >
        {props => (
          <form onSubmit={props.handleSubmit}>
            <input
              type="text"
              onChange={props.handleChange}
              onBlur={props.handleBlur}
              value={props.values.nom}
              name="name"
            />
            {props.errors.nom && <div id="feedback">{props.errors.nom}</div>}
            <button type="submit">Submit</button>
          </form>
        )}
      </Formik>
    </>
  );
};

export default RegistrationForm;
