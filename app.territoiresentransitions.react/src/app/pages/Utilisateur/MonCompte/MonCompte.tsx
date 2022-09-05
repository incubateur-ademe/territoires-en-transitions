import * as Yup from 'yup';
import {Field, Form, Formik, FormikHandlers} from 'formik';
import {useAuth, useDCP} from 'core-logic/api/auth/AuthProvider';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Spacer} from 'ui/shared/Spacer';

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

  const {mutate: mutateDCP} = useDCP(user?.id);

  return (
    user && (
      <div>
        <h1 className="!mb-8 md:!mb-14">Mon compte</h1>
        <div className="p-4 md:p-14 lg:px-24 bg-gray-100">
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
                  name="prenom"
                  label="Prénom"
                  type="text"
                  component={LabeledTextField}
                  onBlur={(evt: FormikHandlers['handleBlur']) => {
                    handleBlur(evt);
                    isValid && mutateDCP({prenom: values.prenom});
                  }}
                />
                <Spacer size={3} />
                <Field
                  name="nom"
                  label="Nom"
                  type="text"
                  component={LabeledTextField}
                  onBlur={(evt: FormikHandlers['handleBlur']) => {
                    handleBlur(evt);
                    isValid && mutateDCP({nom: values.nom});
                  }}
                />
                <Spacer size={3} />
                <Field
                  name="email"
                  label="Email"
                  type="text"
                  component={LabeledTextField}
                />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    )
  );
};

export default MonCompte;
