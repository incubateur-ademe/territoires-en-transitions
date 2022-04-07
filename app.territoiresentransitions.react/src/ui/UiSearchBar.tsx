import {useDebouncedInput} from './shared/useDebouncedInput';

export const UiSearchBar = ({
  search,
  debouncePeriod = 1000,
}: {
  search: (value: string) => void;
  debouncePeriod?: number;
}) => {
  const [query, onChange] = useDebouncedInput('', search, debouncePeriod);

  return (
    <div className="flex">
      <div className=" border-b-2 border-bf500 flex items-center">
        <input
          className="bg-beige w-80 p-2"
          key="random1"
          value={query || ''}
          placeholder={'Rechercher'}
          onChange={onChange}
        />
        <div className="bg-bf500 h-full p-2">
          <div className="fr-fi-search-line text-white" />
        </div>
      </div>
    </div>
  );
};
