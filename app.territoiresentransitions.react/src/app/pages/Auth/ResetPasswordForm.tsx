import {useState} from 'react';
import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import {Link} from 'react-router-dom';
import {
  updatePassword,
  UpdatePasswordParams,
} from 'core-logic/api/auth/updatePassword';
import {getPasswordStrength} from 'core-logic/api/auth/getPasswordStrength';
import {signInPath} from 'app/paths';
import {Spacer} from 'ui/shared/Spacer';
import {ValiderButton} from 'ui/shared/ValiderButton';
import {PasswordStrengthMeter} from 'ui/forms/PasswordStrengthMeter';
import {passwordValidator} from './RegisterForm';
import FormInput from 'ui/shared/form/FormInput';

type FormState = 'ready' | 'success' | 'failure';

type InitialFormState = {
  _formState: FormState;
  _errorMsg?: string;
};

/**
 * Affiche le formulaire de réinitialisation du mot de passe
 * L'utilisateur est redirigé sur cette page lorsqu'il clique sur le lien reçu
 * par mail.
 */
const ResetPasswordForm = ({
  initialState,
}: {
  /** état initial (pour les tests) */
  initialState?: InitialFormState;
}) => {
  const [state, setState] = useState<FormState>(
    initialState?._formState || 'ready'
  );
  const [errorMessage, setErrorMessage] = useState<string>(
    initialState?._errorMsg || ''
  );

  if (state === 'failure') {
    return (
      <section
        data-test="ResetPasswordFailed"
        className="max-w-2xl mx-auto p-5 text-center"
      >
        <Spacer />
        <p>Le mot de passe n'a pas pu être réinitialisé... </p>
        <p>{errorMessage || 'Erreur indéterminée'}</p>
        <Spacer />
      </section>
    );
  } else if (state === 'success') {
    return (
      <section
        data-test="ResetPasswordSucceed"
        className="max-w-2xl mx-auto p-5 text-center"
      >
        <Spacer />
        <p>Votre mot de passe a bien été réinitialisé !</p>
        <Spacer />
        <div>
          <Link to={signInPath} className="fr-btn">
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  const initialData: UpdatePasswordParams = {
    password: '',
  };

  const validation = Yup.object({
    password: passwordValidator,
  });

  const register = (data: UpdatePasswordParams) => {
    updatePassword(data)
      .then(() => {
        setState('success');
      })
      .catch(reason => {
        setState('failure');
        setErrorMessage(`${reason}`);
      });
  };

  return (
    <section data-test="ResetPassword" className="max-w-2xl mx-auto p-5">
      <Spacer />
      <h2 className="fr-h2 flex justify-center">
        Créer un nouveau mot de passe
      </h2>
      <p className="mb-4">
        C’est presque terminé ! Choisissez votre nouveau mot de passe et vous
        pourrez vous connecter.
      </p>
      <div className="mx-auto">
        <Formik<UpdatePasswordParams>
          initialValues={initialData}
          validationSchema={validation}
          onSubmit={register}
        >
          {({values}) => {
            const result = getPasswordStrength(values.password, []);

            return (
              <Form>
                <Field
                  type="password"
                  name="password"
                  label="Nouveau mot de passe"
                  component={FormInput}
                />
                {result.score > 0 && (
                  <PasswordStrengthMeter strength={result} className="pt-2" />
                )}
                <Spacer size={2} />
                <div className="max-w-2xl flex flex-row-reverse">
                  <ValiderButton />
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </section>
  );
};

export default ResetPasswordForm;
