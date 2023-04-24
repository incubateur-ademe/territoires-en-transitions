import React from 'react';
import {useState} from 'react';
import SelectCreateTagsDropdown from './SelectCreateTagsDropdown';

export default {
  component: SelectCreateTagsDropdown,
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
  const [options, setOptions] = useState(fakeOptions);
  const [userGeneratedOptions, setUserGeneratedOptions] = useState(['option2']);
  const [values, setValues] = useState<string[]>([]);
  return (
    <SelectCreateTagsDropdown
      options={options}
      values={values}
      onCreateClick={inputValue => {
        setOptions([...options, {label: inputValue, value: inputValue}]);
        setValues([...values, inputValue]);
        setUserGeneratedOptions([...userGeneratedOptions, inputValue]);
      }}
      onDeleteClick={tag_id => {
        setOptions(options.filter(o => o.value !== tag_id));
        setValues(values.filter(v => v !== tag_id));
        setUserGeneratedOptions(userGeneratedOptions.filter(o => o !== tag_id));
      }}
      onUpdateTagName={(tag_id, tag_name) => {
        setOptions(
          options.map(o =>
            o.value === tag_id ? {label: tag_name, value: o.value} : o
          )
        );
      }}
      onSelect={v => setValues(v)}
      userCreatedTagIds={userGeneratedOptions}
      placeholderText="Sélectionner une ou plusieurs options..."
    />
  );
};
