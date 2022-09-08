import * as Yup from 'yup';
import {Field, Form, Formik, FormikHandlers} from 'formik';

import LabeledTextField from 'ui/forms/LabeledTextField';
import {Spacer} from 'ui/shared/Spacer';

import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useUpdateEmail} from 'core-logic/api/auth/useUpdateEmail';
import {useUpdateDCP} from 'core-logic/api/auth/useUpdateDCP';

interface ModifierCompteData {
  prenom: string;
  nom: string;
  email: string;
}

const MonCompte = () => {
  const {user} = useAuth();

  const validation = Yup.object({
    prenom: Yup.string().required('Champ requis'),
    nom: Yup.string().required('Champ requis'),
    email: Yup.string()
      .email("Cette adresse email n'est pas valide")
      .required('Champ requis'),
  });

  const {handleUpdateDCP, renderToast: renderDCPToast} = useUpdateDCP(
    user ? user.id : ''
  );
  const {handleUpdateEmail, renderToast: renderEmailToast} = useUpdateEmail();

  return (
    user && (
      <div data-test="MonCompte">
        <h1 className="!mb-8 md:!mb-14">Mon compte</h1>
        <div
          data-test="modification-compte-formulaire"
          className="p-4 md:p-14 lg:px-24 bg-gray-100"
        >
          <p className="text-sm">Information requises</p>
          <Formik<ModifierCompteData>
            initialValues={{
              prenom: user.prenom!,
              nom: user.nom!,
              email: user.email!,
            }}
            validationSchema={validation}
            onSubmit={() => undefined}
          >
            {({values, isValid, handleBlur}) => (
              <Form>
                <Field
                  data-test="prenom"
                  name="prenom"
                  label="Prénom"
                  type="text"
                  component={LabeledTextField}
                  onBlur={(evt: FormikHandlers['handleBlur']) => {
                    handleBlur(evt);
                    isValid &&
                      user.prenom !== values.prenom &&
                      handleUpdateDCP({prenom: values.prenom});
                  }}
                />
                <Spacer size={3} />
                <Field
                  data-test="nom"
                  name="nom"
                  label="Nom"
                  type="text"
                  component={LabeledTextField}
                  onBlur={(evt: FormikHandlers['handleBlur']) => {
                    handleBlur(evt);
                    isValid &&
                      user.nom !== values.nom &&
                      handleUpdateDCP({nom: values.nom});
                  }}
                />
                <Spacer size={3} />
                <Field
                  name="email"
                  label="Email"
                  type="text"
                  component={LabeledTextField}
                  onBlur={(evt: FormikHandlers['handleBlur']) => {
                    handleBlur(evt);
                    isValid &&
                      user.email !== values.email &&
                      handleUpdateEmail({email: values.email});
                  }}
                />
              </Form>
            )}
          </Formik>
          {renderDCPToast()}
          {renderEmailToast()}
        </div>
      </div>
    )
  );
};

export default MonCompte;
