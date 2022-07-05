import {useDebouncedInput} from './shared/useDebouncedInput';

export const UiSearchBar = ({
  search,
  debouncePeriod = 1000,
  placeholder = 'Rechercher',
}: {
  search: (value: string) => void;
  debouncePeriod?: number;
  placeholder?: string;
}) => {
  const [query, onChange] = useDebouncedInput('', search, debouncePeriod);

  return (
    <div className="border border-bf500 rounded-tr rounded-tl">
      <div className="flex items-center w-full border-b-2 border-bf500">
        <input
          className="bg-beige p-2 w-full placeholder-gray-500"
          key="random1"
          value={query || ''}
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
