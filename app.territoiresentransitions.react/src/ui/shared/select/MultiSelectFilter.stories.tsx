import React from 'react';
import {useState} from 'react';
import {MultiSelectFilter} from './MultiSelectFilter';
import {ITEM_ALL} from './commons';
import classNames from 'classnames';

export default {
  component: MultiSelectFilter,
};

const fakeOptions: {
  value: string;
  label: string;
}[] = [
  {value: ITEM_ALL, label: 'Tous'},
  {value: '1', label: 'Option 1'},
  {value: '2', label: 'Option 2'},
  {value: '3', label: 'Option 3'},
  {value: '4', label: 'Option 4'},
];

export const AucuneOptionSelectionee = () => {
  const [values, setValues] = useState([ITEM_ALL]);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onSelect={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
    />
  );
};

export const PlusieursOptionsSelectionees = () => {
  const [values, setValues] = useState(['2', '3']);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onSelect={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
    />
  );
};

export const CustomOptionEtSelection = () => {
  const [values, setValues] = useState(['2', '3']);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onSelect={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
      renderSelection={() => (
        <span className="fr-fi-filter-fill fr-fi--sm w-full text-center text-bf500 font-bold">
          &nbsp;Custom open button
        </span>
      )}
      renderOption={value => (
        <span
          className={classNames({
            'mr-auto py-1 px-2 rounded bg-teal-600 text-white':
              value !== 'tous',
          })}
        >
          {value}
        </span>
      )}
    />
  );
};
