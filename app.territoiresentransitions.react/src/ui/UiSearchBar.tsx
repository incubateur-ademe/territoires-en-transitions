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
    <div className="flex">
      <div className=" border-b-2 border-bf500 flex items-center w-full">
        <input
          className="bg-beige p-2 w-full"
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
