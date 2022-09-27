import React from 'react';
import {Field, Form, Formik} from 'formik';
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
      <Field name="input" label="Basique input" component={FormInput} />
      <Field
        disabled
        name="inputDisabled"
        label="Input désactivé"
        component={FormInput}
      />
      <Field
        name="email"
        label="Adresse email avec hint *"
        hint="Entrez une adresse valide"
        component={FormInput}
      />
      <Field
        type="password"
        name="password"
        label="Mot de passe *"
        component={FormInput}
      />
      <Field
        type="area"
        name="textarea"
        label="Text area"
        component={FormInput}
      />
    </Form>
  </Formik>
);
