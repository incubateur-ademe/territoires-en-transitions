import React from 'react';
import {Form, Formik} from 'formik';
import * as Yup from 'yup';

import FormInput from './FormInput';

export default {
  component: FormInput,
};

const validation = Yup.object({
  email: Yup.string()
    .email("Cette adresse email n'est pas valide")
    .required('Champ requis'),
  password: Yup.string()
    .min(8, 'Ce champ doit faire au minimum 8 caractères')
    .max(300, 'Ce champ doit faire au maximum 300 caractères')
    .test('is-robust', 'Ce mot de passe est trop simple', value => !value)
    .required('Champ requis'),
});

export const Defaut = () => (
  <Formik
    initialValues={{input: '', email: ''}}
    validationSchema={validation}
    onSubmit={() => undefined}
  >
    <Form>
      <FormInput name="input" label="Basique input" />
      <FormInput disabled name="inputDisabled" label="Input désactivé" />
      <FormInput
        name="email"
        label="Adresse email avec hint *"
        hint="Entrez une adresse valide"
      />
      <FormInput type="password" name="password" label="Mot de passe *" />
      <FormInput type="area" name="textarea" label="Text area" />
    </Form>
  </Formik>
);
