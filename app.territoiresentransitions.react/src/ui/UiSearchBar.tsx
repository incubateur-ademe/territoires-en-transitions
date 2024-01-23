import {ChangeEventHandler} from 'react';
import {useDebouncedInput} from './shared/useDebouncedInput';

export const UiSearchBar = ({
  dataTest,
  search,
  value = '',
  debouncePeriod = 1000,
  placeholder = 'Rechercher',
}: {
  dataTest?: string;
  search: (value: string) => void;
  value?: string;
  debouncePeriod?: number;
  placeholder?: string;
}) => {
  const [query, onChange] = useDebouncedInput(value, search, debouncePeriod);

  return (
    <InputSearch
      dataTest={dataTest}
      value={query}
      placeholder={placeholder}
      onChange={onChange}
    />
  );
};

export const InputSearch = ({
  dataTest,
  value,
  placeholder,
  onChange,
}: {
  dataTest?: string;
  value?: string;
  placeholder: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) => {
  return (
    <div className="border border-bf500 rounded-tr rounded-tl">
      <div className="flex items-center w-full border-b-2 border-bf500">
        <input
          data-test={dataTest}
          className="bg-beige p-2 w-full placeholder-gray-500"
          type="search"
          value={value || ''}
          placeholder={placeholder}
          onChange={onChange}
        />
        <div className="bg-bf500 h-full p-2">
          <div className="fr-fi-search-line text-white" />
        </div>
      </div>
    </div>
  );
};
