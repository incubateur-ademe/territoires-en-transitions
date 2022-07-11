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
import {getPasswordStrength} from 'core-logic/api/auth/getPasswordStrength';
import {signInPath} from 'app/paths';
import {Spacer} from 'ui/shared/Spacer';
import {ValiderButton} from 'ui/shared/ValiderButton';
import {PasswordStrengthMeter} from 'ui/forms/PasswordStrengthMeter';

type FormState = 'ready' | 'success' | 'failure';

// le score du mdp dépend aussi des autres champs du formulaire
const getScore = (
  password: string,
  {email, nom, prenom}: InscriptionUtilisateur
) => getPasswordStrength(password, [email, nom, prenom]);

export const passwordValidator = Yup.string()
  .min(8, 'Ce champ doit faire au minimum 8 caractères')
  .max(300, 'Ce champ doit faire au maximum 300 caractères')
  .test(
    'is-robust',
    'Ce mot de passe est trop simple',
    (value, context) => !value || getScore(value, context.parent).score > 3
  )
  .required('Champ requis');

export const emailValidator = Yup.string()
  .email("Cette adresse email n'est pas valide")
  .required('Champ requis');

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;
const phoneValidator = Yup.string().matches(
  phoneRegExp,
  "Ce numéro de téléphone n'est pas valide"
);

const validation = Yup.object({
  email: emailValidator,
  telephone: phoneValidator,
  nom: Yup.string()
    .max(300, 'Ce champ doit faire au maximum 300 caractères')
    .required('Champ requis'),
  prenom: Yup.string()
    .max(300, 'Ce champ doit faire au maximum 300 caractères')
    .required('Champ requis'),
  password: passwordValidator,
  vie_privee_conditions: Yup.boolean().isTrue('Champ requis'),
});

const textFieldLabels: Partial<Record<keyof InscriptionUtilisateur, string>> = {
  prenom: 'Prénom',
  nom: 'Nom',
  email: 'Email',
  password: 'Mot de passe',
  telephone: 'Numéro de téléphone professionnel',
};

const RegistrationFormTextField = ({
  fieldName,
  type,
}: {
  fieldName: keyof InscriptionUtilisateur;
  type?: string;
}) => (
  <div>
    <Field
      name={fieldName}
      label={textFieldLabels[fieldName]}
      component={LabeledTextField}
      type={type}
    />
  </div>
);

const CGU = ({showWarning}: {showWarning?: boolean}) => (
  <label className="cgu">
    {showWarning && (
      <div className="mb-2 text-sm opacity-80 text-red-500">
        L'acceptation de la politique de protection des données à caractère
        personnel est nécessaire pour créer un compte.
      </div>
    )}
    <Field type="checkbox" name="vie_privee_conditions" />
    <span className="ml-2">
      J'accepte la{' '}
      <a
        target="_blank"
        rel="noopener noreferrer"
        className=" text-blue-600"
        href={politique_vie_privee}
      >
        politique de protection des données à caractère personnel de l'ADEME
      </a>
    </span>{' '}
  </label>
);
/**
 * The user registration form.
 */
const RegistrationForm = () => {
  const [state, setState] = useState<FormState>('ready');

  if (state === 'failure') {
    return (
      <section className="max-w-2xl mx-auto p-5 text-center">
        <Spacer />
        Le compte n'a pas pu être créé. Un compte existe peut-être déjà avec la
        même adresse email, essayez de vous connecter et/ou de renouveler votre
        mot de passe. Si le problème persiste,&nbsp;
        <a href="mailto:contact@territoiresentransitions.fr" target="_blank">
          contactez-nous
        </a>
        .
      </section>
    );
  } else if (state === 'success') {
    return (
      <section className="max-w-2xl mx-auto p-5 text-center">
        <Spacer />
        <p>Votre compte a bien été créé ! </p>
        <Spacer />
        <div>
          <Link to={signInPath} className="fr-btn">
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  const initialData: InscriptionUtilisateur = {
    email: '',
    nom: '',
    prenom: '',
    password: '',
    vie_privee_conditions: false,
  };

  const register = (data: InscriptionUtilisateur) => {
    registerUser(data)
      .then(() => {
        setState('success');
      })
      .catch(() => {
        setState('failure');
      });
  };

  return (
    <section className="max-w-2xl mx-auto p-5">
      <Spacer />
      <h2 className="fr-h2 flex justify-center">Créer un compte</h2>
      <div className="mx-auto">
        <Formik<InscriptionUtilisateur>
          initialValues={initialData}
          validationSchema={validation}
          onSubmit={register}
        >
          {({errors, touched, values}) => {
            const result = getScore(values.password, values);

            return (
              <Form>
                <div className="flex flex-col gap-6">
                  <RegistrationFormTextField fieldName="email" />
                  <RegistrationFormTextField
                    fieldName="password"
                    type="password"
                  />
                  {result.score > 0 && (
                    <PasswordStrengthMeter strength={result} className="pt-2" />
                  )}
                  <RegistrationFormTextField fieldName="prenom" />
                  <RegistrationFormTextField fieldName="nom" />
                  <RegistrationFormTextField fieldName="telephone" />
                  <CGU
                    showWarning={
                      !!errors.vie_privee_conditions &&
                      touched.vie_privee_conditions
                    }
                  />
                  <Spacer size={2} />
                  <div className="max-w-2xl flex flex-row-reverse">
                    <ValiderButton />
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </section>
  );
};

export default RegistrationForm;
