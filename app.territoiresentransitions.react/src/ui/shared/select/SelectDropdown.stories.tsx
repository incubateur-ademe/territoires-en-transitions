import { useState } from 'react';
import SelectDropdown from './SelectDropdown';

export default {
  component: SelectDropdown,
};

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

export const Default = () => {
  const [value, setValue] = useState(undefined);
  return (
    <SelectDropdown
      value={value}
      options={options}
      onSelect={(v) => setValue(v)}
      placeholderText="Sélectionner une option"
    />
  );
};

export const CustomOptionEtSelection = () => {
  const [value, setValue] = useState('option2');
  return (
    <SelectDropdown
      value={value}
      options={options}
      onSelect={(v) => setValue(v)}
      placeholderText="Sélectionner une option"
      renderOption={(option) => (
        <span className="py-1 px-2 rounded bg-teal-600 text-white">
          {option.value}
        </span>
      )}
      renderSelection={(value) => (
        <span className="mr-auto py-1 px-2 rounded bg-teal-600 text-white">
          {value}
        </span>
      )}
    />
  );
};
