import {Field, Form, Formik} from 'formik';
import * as Yup from 'yup';
import LabeledTextField from 'ui/forms/LabeledTextField';
import {Spacer} from 'ui/shared/Spacer';

interface IMainContact {
  email: string;
  name: string;
}

type TMainContactFormProps = {
  name: string;
  email: string;
  onUpdateContact: (values: IMainContact) => void;
};
/**
 */
const MainContactForm = (props: TMainContactFormProps) => {
  const {email, name, onUpdateContact} = props;
  const validation = Yup.object({
    email: Yup.string()
      .email("Cette adresse email n'est pas valide")
      .required('Champ requis'),
    name: Yup.string().required('Champ requis'),
  });

  return (
    <section className="max-w-2xl">
      <Formik<IMainContact>
        initialValues={{email: email || '', name: name || ''}}
        validationSchema={validation}
        onSubmit={onUpdateContact}
      >
        {() => (
          <Form>
            <Field
              name="name"
              label="Nom du contact"
              type="text"
              component={LabeledTextField}
            />
            <Spacer size={2} />
            <Field
              name="email"
              label="Email"
              type="text"
              component={LabeledTextField}
            />
            <Spacer size={2} />
            <div className="flex flex-row-reverse justify-between">
              <button className="fr-btn fr-btn--secondary h-6">
                Enregistrer
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </section>
  );
};

export default MainContactForm;
