import React from 'react';
import {useState} from 'react';
import {MultiSelectFilter} from './MultiSelectFilter';
import {ITEM_ALL} from './commons';

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

export const MultiSelectFilterAucuneOptionSelectionee = () => {
  const [values, setValues] = useState([ITEM_ALL]);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onChange={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
    />
  );
};

export const MultiSelectFilterPlusieursOptionsSelectionees = () => {
  const [values, setValues] = useState(['2', '3']);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onChange={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
    />
  );
};

export const MultiSelectFilterPlusieursOptionsSelectioneesUneLigne = () => {
  const [values, setValues] = useState(['2', '3', '4']);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onChange={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
      inlineValues
    />
  );
};

export const MultiSelectFilterCustomOpenButton = () => {
  const [values, setValues] = useState(['2', '3']);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onChange={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
      customOpenButton={
        <span className="fr-fi-filter-fill fr-fi--sm w-full text-center text-bf500 font-bold">
          &nbsp;Custom open button
        </span>
      }
    />
  );
};

export const MultiSelectFilterCustomOption = () => {
  const [values, setValues] = useState(['2']);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onChange={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
      inlineValues
      customOption={option =>
        option.value === ITEM_ALL ? (
          <span className="leading-6">Toutes les options</span>
        ) : (
          <span className="px-2 bg-yellow-200 rounded-md">{option.label}</span>
        )
      }
    />
  );
};
