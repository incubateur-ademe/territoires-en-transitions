import React from 'react';
import {useState} from 'react';
import AutocompleteInputSelect from './AutocompleteInputSelect';

export default {
  component: AutocompleteInputSelect,
};

const fakeOptions = [
  {
    label: 'eci',
    value: 'option1',
  },
  {
    label: 'cae 1.1',
    value: 'option2',
  },
  {
    label: 'crte',
    value: 'option3',
  },
];

export const Default = () => {
  const [values, setValues] = useState<string[]>([]);
  return (
    <AutocompleteInputSelect
      containerWidthMatchButton
      values={values}
      options={fakeOptions}
      onSelect={values => setValues(values)}
      placeholderText="Recherchez par mots-clés"
    />
  );
};
