import { isEqual } from 'es-toolkit';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useState } from 'react';
import { FormFilters } from '../filters/types';

export const useManageFichesPagination = (filters: FormFilters) => {
  const [currentPage, setCurrentPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1)
  );
  const [lastFilters, setLastFilters] = useState(filters);

  const resetPagination = () => setCurrentPage(1);

  // Reset pagination when filters change
  if (!isEqual(lastFilters, filters)) {
    setLastFilters(filters);
    resetPagination();
  }

  return {
    currentPage,
    setCurrentPage,
    resetPagination,
  };
};
