import React from 'react';
import {useState} from 'react';
import MultiSelectTagsDropdown from './MultiSelectTagsDropdown';

export default {
  component: MultiSelectTagsDropdown,
};

const fakeOptions = [
  {
    label: 'Option 1',
    value: 'option1',
  },
  {
    label: 'Option 2',
    value: 'option2',
  },
  {
    label: 'Option 3',
    value: 'option3',
  },
];

export const Default = () => {
  const [values, setValues] = useState([]);
  return (
    <MultiSelectTagsDropdown
      options={fakeOptions}
      values={values}
      onSelect={v => setValues(v)}
      placeholderText="Sélectionner une ou plusieurs options..."
    />
  );
};
