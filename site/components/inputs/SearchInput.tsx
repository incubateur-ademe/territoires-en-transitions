type SearchInputProps = {
  id: string;
  placeholder?: string;
};

const SearchInput = ({id, placeholder}: SearchInputProps) => {
  return (
    <div className="fr-search-bar mb-6" id="header-search" role="search">
      <label className="fr-label" htmlFor={`search-${id}`}>
        Recherche
      </label>
      <input
        className="fr-input"
        placeholder={placeholder}
        type="search"
        id={`search-${id}`}
        name={`search-${id}`}
      />
      <button className="fr-btn" title="Rechercher">
        Rechercher
      </button>
    </div>
  );
};

export default SearchInput;
