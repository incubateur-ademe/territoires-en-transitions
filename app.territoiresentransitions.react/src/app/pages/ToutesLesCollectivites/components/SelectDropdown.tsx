import {MenuItem, Select} from '@material-ui/core';
import {TSelectOption} from 'app/pages/ToutesLesCollectivites/types';
import {ChangeEvent, useState} from 'react';

export type TSelectDropdownProps<T extends string> = {
  title: string;
  options: TSelectOption<T>[];
  selected?: T;
  onChange: (selected: T) => void;
};

/**
 * Permet de sélectionner une option d'une liste via un dropdown
 */
export const SelectDropdown = <T extends string>(
  props: TSelectDropdownProps<T>
) => {
  const [selected, setSelected] = useState<T | undefined>(props.selected);
  return (
    <div>
      <div className="mb-2 font-semibold">{props.title}</div>
      <Select
        style={{
          maxHeight: '45px',
          minWidth: '200px',
          borderColor: 'lightgray',
          borderWidth: '0.6px',
          borderStyle: 'solid',
          borderBottomColor: 'black',
          borderBottomWidth: '0.7px',
          borderRadius: '0.2rem',
        }}
        className="select w-full md:w-auto"
        value={props.selected}
        variant="outlined"
        renderValue={() => (
          <span className="text-gray-800 font-normal">
            {props.options.find(option => option.id === selected)?.libelle}
          </span>
        )}
        onChange={(event: ChangeEvent<{value: unknown}>) => {
          const selectedValue = event.target.value as T;
          props.onChange(selectedValue);
          setSelected(selectedValue);
        }}
      >
        {props.options.map(option => (
          <MenuItem
            key={option.id}
            value={option.id}
            className={
              option.id === selected ? 'fr-fi-check-line' : 'offset-item'
            }
          >
            <span>{option.libelle}</span>
          </MenuItem>
        ))}
      </Select>
    </div>
  );
};
