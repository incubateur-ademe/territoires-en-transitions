import React from 'react';
import {useState} from 'react';
import MultiSelectDropdown from './MultiSelectDropdown';

export default {
  component: MultiSelectDropdown,
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

export const AucuneOptionSelectionee = () => {
  const [values, setValues] = useState([]);
  return (
    <MultiSelectDropdown
      options={fakeOptions}
      values={values}
      onSelect={v => setValues(v)}
      placeholderText="Sélectionner une ou plusieurs options..."
    />
  );
};

export const UneOptionSelectionee = () => {
  const [values, setValues] = useState(['option2']);
  return (
    <MultiSelectDropdown
      options={fakeOptions}
      values={values}
      onSelect={v => setValues(v)}
      placeholderText="Sélectionner une ou plusieurs options..."
    />
  );
};

export const PlusieursOptionsSelectionees = () => {
  const [values, setValues] = useState(['option2', 'option3']);
  return (
    <MultiSelectDropdown
      options={fakeOptions}
      values={values}
      onSelect={v => setValues(v)}
      placeholderText="Sélectionner une ou plusieurs options..."
    />
  );
};

export const CustomOptionEtSelection = () => {
  const [values, setValues] = useState(['option2', 'option3']);
  return (
    <MultiSelectDropdown
      options={fakeOptions}
      values={values}
      onSelect={v => setValues(v)}
      placeholderText="Sélectionner une ou plusieurs options..."
      renderSelection={values => (
        <span className="mr-auto">
          {values.sort().map(value => (
            <span
              key={value}
              className="mr-4 py-1 px-2 rounded bg-teal-600 text-white"
            >
              {fakeOptions.find(({value: v}) => v === value)?.label || ''}
            </span>
          ))}
        </span>
      )}
      renderOption={value => (
        <span className="mr-auto py-1 px-2 rounded bg-teal-600 text-white">
          {value}
        </span>
      )}
    />
  );
};
