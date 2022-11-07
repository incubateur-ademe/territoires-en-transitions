import React from 'react';
import {useState} from 'react';
import {action} from '@storybook/addon-actions';
import {
  SelectDropdown,
  MultiSelectDropdown,
  SelectDropdownCustom,
} from './SelectDropdown';

export default {
  component: SelectDropdown,
};

const fakeLabels: Record<string, string> = {
  option1: 'Option 1',
  option2: 'Option 2',
  option3: 'Option 3',
};

const options = [
  {value: 'option1', label: 'Option 1'},
  {value: 'option2', label: 'Option 2'},
  {value: 'option3', label: 'Option 3'},
];

export const AucuneOptionSelectionee = () => {
  const [value, setValue] = useState<undefined | string>(undefined);
  return (
    <SelectDropdown
      labels={fakeLabels}
      value={value}
      onSelect={v => setValue(v)}
    />
  );
};

export const AvecPlaceholder = () => {
  const [value, setValue] = useState<undefined | string>(undefined);
  return (
    <SelectDropdown
      labels={fakeLabels}
      value={value}
      onSelect={v => setValue(v)}
      placeholderText="À renseigner"
    />
  );
};

export const OptionSelectionee = () => {
  const [value, setValue] = useState('option2');
  return (
    <SelectDropdown
      labels={fakeLabels}
      value={value}
      onSelect={v => setValue(v)}
    />
  );
};

export const MultiSelectAucuneOptionSelectionee = () => {
  const [values, setValues] = useState<undefined | string[]>(undefined);
  return (
    <MultiSelectDropdown
      options={options}
      values={values}
      onSelect={v => setValues(v)}
    />
  );
};

export const MultiSelectAvecPlaceholder = () => {
  const [values, setValues] = useState<undefined | string[]>(undefined);
  return (
    <MultiSelectDropdown
      options={options}
      values={values}
      onSelect={v => setValues(v)}
      placeholderText="À renseigner"
    />
  );
};

export const MultiSelectUneOptionSelectionee = () => {
  const [values, setValues] = useState(['option2']);
  return (
    <MultiSelectDropdown
      options={options}
      values={values}
      onSelect={v => setValues(v)}
    />
  );
};

export const MultiSelectRenduPersonnalise = () => {
  const [values, setValues] = useState(['option2', 'option1']);
  return (
    <MultiSelectDropdown
      options={options}
      values={values}
      onSelect={v => setValues(v)}
      renderValue={v => <span style={{color: 'red'}}>{v}</span>}
      renderSelection={values => (
        <span style={{color: 'green'}}>{values?.sort().join(';')}</span>
      )}
    />
  );
};

export const RenduPersonnalise = () => {
  return (
    <SelectDropdownCustom
      value="option 1"
      options={['option 1', 'option2']}
      renderOption={v => <div>rendu personnalisé de {v}</div>}
      onSelect={action('onChange')}
    />
  );
};
