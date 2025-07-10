import { useState } from 'react';

export const useFicheActionSearch = () => {
  const [search, setSearch] = useState<string>();
  const [debouncedSearch, setDebouncedSearch] = useState<string>();

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSearchSubmit = (value: string) => {
    setDebouncedSearch(value);
  };

  return {
    search,
    debouncedSearch,
    handleSearchChange,
    handleSearchSubmit,
  };
};
