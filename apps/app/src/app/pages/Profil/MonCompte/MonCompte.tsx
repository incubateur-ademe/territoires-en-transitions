'use client';

import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import * as Yup from 'yup';

import FormikInput from '@/app/ui/shared/form/formik/FormikInput';
import ModifierEmailModal from './ModifierEmailModal';

import { UserDetails } from '@/api/users/user-details.fetch.server';
import { useUser } from '@/api/users/user-provider';
import { useUpdatePersonalDetails } from '@/app/users/use-update-personal-details';

interface ModifierCompteData {
  prenom: string;
  nom: string;
  email: string;
}

const validation = Yup.object({
  prenom: Yup.string().required('Champ requis'),
  nom: Yup.string().required('Champ requis'),
  email: Yup.string()
    .email("Cette adresse email n'est pas valide")
    .required('Champ requis'),
});

export const MonCompte = ({ user }: { user: UserDetails }) => {
  const { handleUpdateDCP } = useUpdatePersonalDetails(user.id);

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
            prenom: user.prenom,
            nom: user.nom,
            email: user.email ?? '',
          }}
          validationSchema={validation}
          onSubmit={() => undefined}
        >
          {({ values, isValid, handleBlur, resetForm }) => (
            <Form className="flex flex-col gap-6">
              <FormikInput
                data-test="prenom"
                name="prenom"
                label="Prénom"
                onBlur={(evt: React.FocusEvent) => {
                  handleBlur(evt);
                  isValid &&
                    user.prenom !== values.prenom &&
                    handleUpdateDCP({ prenom: values.prenom });
                }}
              />
              <FormikInput
                data-test="nom"
                name="nom"
                label="Nom"
                onBlur={(evt: React.FocusEvent) => {
                  handleBlur(evt);
                  isValid &&
                    user.nom !== values.nom &&
                    handleUpdateDCP({ nom: values.nom });
                }}
              />
              <FormikInput
                data-test="email"
                name="email"
                label="Email"
                onBlur={(evt: React.FocusEvent) => {
                  handleBlur(evt);
                  isValid &&
                    user.email !== values.email &&
                    setIsEmailModalOpen(true);
                }}
              />
              <ModifierEmailModal
                isOpen={isEmailModalOpen}
                setOpen={setIsEmailModalOpen}
                resetEmail={() =>
                  resetForm({ values: { ...values, email: user.email! } })
                }
                email={values.email}
              />
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

const MonCompteConnected = () => {
  const user = useUser();

  return user && <MonCompte user={user} />;
};

export default MonCompteConnected;
