import React from 'react';
import {Form, Formik} from 'formik';
import * as Yup from 'yup';

import FormInput from './FormInput';
import FormSelect from './FormSelect';

export default {
  component: FormInput,
};

const selectOptions = [
  {
    value: 'valeur1',
    label: 'Valeur 1',
  },
  {
    value: 'valeur2',
    label: 'Valeur 2',
  },
];

const validation = Yup.object({
  email: Yup.string()
    .email("Cette adresse email n'est pas valide")
    .required('Champ requis'),
  password: Yup.string()
    .min(8, 'Ce champ doit faire au minimum 8 caractères')
    .max(300, 'Ce champ doit faire au maximum 300 caractères')
    .test('is-robust', 'Ce mot de passe est trop simple', value => !value)
    .required('Champ requis'),
  select: Yup.string().required('Ce champ est obligatoire'),
});

export const Defaut = () => (
  <Formik
    initialValues={{input: '', email: '', select: ''}}
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
      <FormSelect name="select" label="Basique elect" options={selectOptions} />
      <FormSelect
        disabled
        name="selectDisabled"
        label="Select désactivé"
        hint="Selecteur avec hint"
        options={selectOptions}
      />
    </Form>
  </Formik>
);
