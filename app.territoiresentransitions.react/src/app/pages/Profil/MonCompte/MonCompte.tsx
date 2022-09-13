import * as Yup from 'yup';
import {Field, Form, Formik, FormikHandlers} from 'formik';

import {Spacer} from 'ui/shared/Spacer';
import Modal from 'ui/shared/floating-ui/Modal';
import LabeledTextField from 'ui/forms/LabeledTextField';

import {useAuth, UserData} from 'core-logic/api/auth/AuthProvider';
import {useUpdateEmail} from 'core-logic/api/auth/useUpdateEmail';
import {useUpdateDCP} from 'core-logic/api/auth/useUpdateDCP';
import {useState} from 'react';

interface ModifierCompteData {
  prenom: string;
  nom: string;
  email: string;
}

export const MonCompte = ({user}: {user: UserData}) => {
  const validation = Yup.object({
    prenom: Yup.string().required('Champ requis'),
    nom: Yup.string().required('Champ requis'),
    email: Yup.string()
      .email("Cette adresse email n'est pas valide")
      .required('Champ requis'),
  });

  const {handleUpdateDCP, renderToast: renderDCPToast} = useUpdateDCP(user.id);
  const {handleUpdateEmail, renderToast: renderEmailToast} = useUpdateEmail();

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  return (
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
                id="prenom"
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
                id="nom"
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
                data-test="email"
                id="email"
                name="email"
                label="Email"
                type="text"
                component={LabeledTextField}
                onBlur={(evt: FormikHandlers['handleBlur']) => {
                  handleBlur(evt);
                  isValid &&
                    user.email !== values.email &&
                    setIsEmailModalOpen(true);
                }}
              />
              <Modal
                size="lg"
                externalOpen={isEmailModalOpen}
                setExternalOpen={setIsEmailModalOpen}
                render={({labelId, descriptionId}) => (
                  <div data-test="modification-email-modal">
                    <h4 id={labelId} className="fr-h4">
                      Modifier mon adresse email
                    </h4>
                    <p id={descriptionId}>
                      Cette modification sera effective quand vous aurez cliqué
                      sur le lien de validation du message envoyé à la nouvelle
                      adresse associée à votre compte{' '}
                      <span className="font-bold">{values.email}</span>
                    </p>
                    <div className="mt-2 fr-btns-group fr-btns-group--left fr-btns-group--inline-reverse fr-btns-group--inline-lg">
                      <button
                        onClick={() => setIsEmailModalOpen(false)}
                        className="fr-btn fr-btn--secondary"
                        aria-label="Annuler"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateEmail({email: values.email});
                          setIsEmailModalOpen(false);
                        }}
                        aria-label="Confirmer"
                        className="fr-btn"
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}
              />
            </Form>
          )}
        </Formik>
        {renderDCPToast()}
        {renderEmailToast()}
      </div>
    </div>
  );
};

export default () => {
  const {user} = useAuth();

  return user && <MonCompte user={user} />;
};
