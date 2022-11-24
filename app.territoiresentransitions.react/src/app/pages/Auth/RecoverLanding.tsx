import * as Yup from 'yup';
import {Form, Formik} from 'formik';
import {emailValidator} from 'app/pages/Auth/RegisterForm';
import {ValiderButton} from 'ui/shared/ValiderButton';
import {useRecoveryToken} from 'core-logic/hooks/useRecoveryToken';
import {supabaseClient} from 'core-logic/api/supabase';
import {useHistory} from 'react-router-dom';
import {resetPwdPath} from 'app/paths';
import FormInput from 'ui/shared/form/FormInput';

const validation = Yup.object({
  email: emailValidator,
  code: Yup.string(),
});

interface OTPLogin {
  email: string;
  code: string;
}

/**
 * Le formulaire One Time Password, aujourd'hui utilisé pour le password
 * recovery, demain comme méthode alternative au magic link.
 *
 * @param initialData
 * @param onSubmit Le callback appelé par le bouton submit.
 * @constructor
 */
const OTPForm = ({
  initialData,
  onSubmit,
}: {
  initialData: OTPLogin;
  onSubmit: (values: OTPLogin) => void;
}) => {
  return (
    <Formik<OTPLogin>
      initialValues={initialData}
      validationSchema={validation}
      onSubmit={onSubmit}
    >
      {() => {
        return (
          <Form data-test="OTPForm">
            <div className="flex flex-col gap-6">
              <FormInput name="email" label="Votre adresse email" />
              <FormInput name="code" label="Le code reçu par email" />
              <div className="max-w-2xl flex flex-row-reverse">
                <ValiderButton />
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

/**
 * Permet à l'utilisateur de récupérer son mot de passe en utilisant un code.
 */
const RecoverLanding = () => {
  const code = useRecoveryToken() ?? '';
  const history = useHistory();

  const initialData: OTPLogin = {
    email: '',
    code: code,
  };

  const recover = (data: OTPLogin) => {
    supabaseClient.auth
      .verifyOtp({
        email: data.email,
        token: data.code,
        type: 'recovery',
      })
      .then(({error}) => {
        if (error === null) {
          history.push(resetPwdPath);
        } else {
          // todo
          console.error(error);
        }
      });
  };

  return (
    <section className="max-w-2xl mx-auto p-5">
      <h2 className="fr-h2 flex justify-center">Changer de mot de passe</h2>
      <p>Vous avez demandé le renouvellement de votre mot de passe.</p>
      <OTPForm initialData={initialData} onSubmit={recover} />
    </section>
  );
};

export default RecoverLanding;
