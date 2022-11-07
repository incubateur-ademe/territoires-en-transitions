import React from 'react';
import {useState} from 'react';
import SelectDropdown from './SelectDropdown';

export default {
  component: SelectDropdown,
};

const fakeLabels: Record<any, string> = {
  option1: 'Option 1',
  option2: 'Option 2',
  option3: 'Option 3',
};

export const AucuneOptionSelectionee = () => {
  const [value, setValue] = useState(undefined);
  return (
    <SelectDropdown
      labels={fakeLabels}
      value={value}
      onSelect={v => setValue(v)}
    />
  );
};

export const AvecPlaceholder = () => {
  const [value, setValue] = useState(undefined);
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
