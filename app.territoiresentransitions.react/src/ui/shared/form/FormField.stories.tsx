import React from 'react';
import FormField from './FormField';

export default {
  component: FormField,
};

export const Default = () => {
  return (
    <FormField label="Identifiant">
      <input type="text" className="fr-input" placeholder="contact@tet.fr" />
    </FormField>
  );
};

export const Desactive = () => {
  return (
    <FormField label="Identifiant" disabled>
      <input
        type="text"
        className="fr-input"
        placeholder="contact@tet.fr"
        disabled
      />
    </FormField>
  );
};

export const AvecIndice = () => {
  return (
    <FormField label="Label" hint="Indiquez votre adresse email">
      <input type="text" className="fr-input" placeholder="contact@tet.fr" />
    </FormField>
  );
};

export const AvecErreur = () => {
  return (
    <FormField
      label="Label"
      hint="Indiquez votre adresse email"
      errorMessage="L'adresse email doit contenir un '@'"
    >
      <input
        type="text"
        className="fr-input"
        placeholder="contact@tet.fr"
        value="contacttet.fr"
      />
    </FormField>
  );
};
