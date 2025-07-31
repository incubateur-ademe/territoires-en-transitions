import { Icon } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { ITEM_ALL } from '../filters/commons';
import { MultiSelectFilter } from './MultiSelectFilter';

export default {
  component: MultiSelectFilter,
};

const fakeOptions: {
  value: string;
  label: string;
}[] = [
  { value: ITEM_ALL, label: 'Tous' },
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4' },
];

export const Default = () => {
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

export const CustomOptionEtSelection = () => {
  const [values, setValues] = useState(['2', '3']);
  return (
    <MultiSelectFilter
      values={values}
      options={fakeOptions}
      onSelect={(v: string[]) => setValues(v)}
      placeholderText="Sélectionner une option"
      renderSelection={() => (
        <span className="text-center font-bold">
          <Icon
            size="sm"
            className="text-primary-9"
            icon={values.includes(ITEM_ALL) ? 'filter-line' : 'filter-fill'}
          />
          &nbsp;Custom open button
        </span>
      )}
      renderOption={(option) => (
        <span
          className={classNames({
            'mr-auto py-1 px-2 rounded bg-teal-600 text-white':
              option.value !== 'tous',
          })}
        >
          {option.label}
        </span>
      )}
    />
  );
};
