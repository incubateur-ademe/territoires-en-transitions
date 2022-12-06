import React from 'react';
import {Form, Formik} from 'formik';
import * as Yup from 'yup';

import FormikInput from './FormikInput';
import FormikSelect from './FormikSelect';

export default {
  component: FormikInput,
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
      <FormikInput name="input" label="Basique input" />
      <FormikInput disabled name="inputDisabled" label="Input désactivé" />
      <FormikInput
        name="email"
        label="Adresse email avec hint *"
        placeholder="yolo@dodo.com"
        hint="Entrez une adresse valide"
      />
      <FormikInput type="password" name="password" label="Mot de passe *" />
      <FormikInput type="area" name="textarea" label="Text area" />
      <FormikSelect
        name="select"
        label="Basique elect"
        options={selectOptions}
      />
      <FormikSelect
        disabled
        name="selectDisabled"
        label="Select désactivé"
        hint="Selecteur avec hint"
        options={selectOptions}
      />
    </Form>
  </Formik>
);
