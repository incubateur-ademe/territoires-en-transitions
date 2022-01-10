import {v4 as uuid} from 'uuid';
import {useState} from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {TextField, TextFieldProps} from '@material-ui/core';

export type Option<T extends string> = {
  value: T;
  label: string;
};

type AutocompleteInputProps<T extends string> = {
  onChange: (selected: T | null) => void;
  options: Option<T>[];
  defaultValue?: Option<T>;
  label?: string;
  id?: string;
};

export const AutocompleteInput = <T extends string>(
  props: AutocompleteInputProps<T>
) => {
  const htmlId = props.id ?? uuid();
  const [selected, setSelected] = useState<Option<T> | null>(
    props.defaultValue ?? null
  );

  return (
    <div className="w-full">
      <Autocomplete
        id={htmlId}
        disablePortal
        value={selected}
        onChange={(event, newSelection) => {
          setSelected(newSelection);
          props.onChange(newSelection?.value ?? null);
        }}
        options={props.options}
        getOptionLabel={option => option.label}
        renderInput={(params: TextFieldProps) => (
          <TextField {...params} label={props.label} />
        )}
      />
    </div>
  );
};
