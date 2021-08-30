import {v4 as uuid} from 'uuid';
import {Select, MenuItem, FormControl, InputLabel} from '@material-ui/core';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import {useState} from 'react';

export type Option<T extends string> = {
  value: T;
  label: string;
};

type SelectInputProps<T extends string> = {
  onChange: (selected: T) => void;
  options: Option<T>[];
  defaultValue: T;
  label?: string;
  id?: string;
};

export const SelectInput = <T extends string>(props: SelectInputProps<T>) => {
  const htmlId = props.id ?? uuid();
  const [value, setValue] = useState<T>(props.defaultValue);

  const handleChange = (event: React.ChangeEvent<{value: unknown}>) => {
    const selectedValue = event.target.value as T;
    setValue(selectedValue);
    props.onChange(selectedValue);
  };

  return (
    <div>
      <label className="fr-label" htmlFor={htmlId}>
        {props.label}
        <slot />
      </label>
      <select
        className="mt-2  bg-beige p-3 border-b-2 border-gray-500"
        value={value}
        onChange={handleChange}
      >
        {props.options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
