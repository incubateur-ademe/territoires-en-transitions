import {useState} from 'react';
// import SearchBar from 'material-ui-search-bar';
import _ from 'lodash';

export const UiSearchBar = ({
  search,
  debouncePeriod = 50,
}: {
  search: (value: string) => void;
  debouncePeriod?: number;
}) => {
  const [query, setQuery] = useState('');
  const onChange = (event: any) => {
    setQuery(event.target.value);
    const debouncedSearch = _.debounce(search, debouncePeriod);
    debouncedSearch(query);
  };

  return (
    <div className="flex">
      <div className=" border-b-2 border-bf500 flex items-center">
        <input
          className="bg-beige w-80 p-2"
          key="random1"
          value={query}
          placeholder={'Rechercher'}
          onChange={onChange}
          onMouseOut={onChange}
        />
        <div className="bg-bf500 h-full p-2">
          <div className="fr-fi-search-line text-white" />
        </div>
      </div>
    </div>
  );
};
