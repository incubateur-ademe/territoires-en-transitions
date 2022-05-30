import {MenuItem, Select} from '@material-ui/core';
import {TSelectOption} from 'app/pages/ToutesLesCollectivites/types';
import {ChangeEvent, useState} from 'react';

export type TMultiSelectDropdownProps<T extends string> = {
  title: string;
  options: TSelectOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
};

/**
 * Permet de sélectionner plusieurs options d'une liste via un dropdown
 */
export const MultiSelectDropdown = <T extends string>(
  props: TMultiSelectDropdownProps<T>
) => {
  const [selected, setSelected] = useState<T[]>(props.selected);
  return (
    <div>
      <div className="mb-2 font-semibold">{props.title}</div>
      <Select
        MenuProps={{
          getContentAnchorEl: null,
        }}
        multiple
        style={{
          minWidth: '200px',
          borderColor: 'lightgray',
          borderWidth: '0.6px',
          borderStyle: 'solid',
          borderBottomColor: 'black',
          borderBottomWidth: '0.7px',
          borderRadius: '0.2rem',
        }}
        value={selected}
        variant="outlined"
        label="Sélectionner une option" // Does not seem to work :(
        placeholder="Sélectionner une option" // Does not seem to work :(
        renderValue={() => (
          <span className="text-gray-800 font-normal">
            Sélectionner une option
          </span>
        )}
        onChange={(event: ChangeEvent<{value: any}>) => {
          setSelected(event.target.value as T[]);
          props.onChange(selected);
        }}
      >
        {props.options.map(option => (
          <MenuItem
            key={option.id}
            value={option.id}
            className={
              selected.includes(option.id) ? 'fr-fi-check-line' : 'offset-item'
            }
          >
            <span>{option.libelle}</span>
          </MenuItem>
        ))}
      </Select>
    </div>
  );
};
