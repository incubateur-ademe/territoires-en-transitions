import { isEqual } from 'es-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { FormFilters } from '../filters/types';

export const useFicheActionPagination = (
  filters: FormFilters,
  textSearchValue?: string
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [lastFilters, setLastFilters] = useState(filters);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Reset pagination when filters change
  if (!isEqual(lastFilters, filters)) {
    setLastFilters(filters);
    resetPagination();
  }

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [textSearchValue]);

  return {
    currentPage,
    setCurrentPage,
    resetPagination,
  };
};
