import { isEqual } from 'es-toolkit';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useCallback, useState } from 'react';
import { FormFilters } from '../filters/types';

export const useFicheActionPagination = (filters: FormFilters) => {
  const [currentPage, setCurrentPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1)
  );
  const [lastFilters, setLastFilters] = useState(filters);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

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
