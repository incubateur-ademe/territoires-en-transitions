import React from 'react';
import {useState} from 'react';
import MultiSelectDropdown from './MultiSelectDropdown';

export default {
  component: MultiSelectDropdown,
};

const fakeLabels: Record<any, string> = {
  option1: 'Option 1',
  option2: 'Option 2',
  option3: 'Option 3',
};

export const MultiSelectAucuneOptionSelectionee = () => {
  const [values, setValues] = useState(undefined);
  return (
    <MultiSelectDropdown
      labels={fakeLabels}
      values={values}
      onSelect={({v}: any) => setValues(v)}
    />
  );
};

export const MultiSelectAvecPlaceholder = () => {
  const [values, setValues] = useState(undefined);
  return (
    <MultiSelectDropdown
      labels={fakeLabels}
      values={values}
      onSelect={({v}: any) => setValues(v)}
      placeholderText="À renseigner"
    />
  );
};

export const MultiSelectUneOptionSelectionee = () => {
  const [values, setValues] = useState(['option2']);
  return (
    <MultiSelectDropdown
      labels={fakeLabels}
      values={values}
      onSelect={v => setValues(v)}
    />
  );
};

export const MultiSelectPlusieursOptionsSelectionees = () => {
  const [values, setValues] = useState(['option2', 'option3']);
  return (
    <MultiSelectDropdown
      labels={fakeLabels}
      values={values}
      onSelect={v => setValues(v)}
    />
  );
};

export const MultiSelectPlusieursOptionsSelectioneesUneLigne = () => {
  const [values, setValues] = useState(['option2', 'option3']);
  return (
    <MultiSelectDropdown
      labels={fakeLabels}
      inlineValues
      values={values}
      onSelect={v => setValues(v)}
    />
  );
};
