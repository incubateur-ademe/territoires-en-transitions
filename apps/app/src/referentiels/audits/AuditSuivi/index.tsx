'use client';

import { DeleteFiltersButton } from '@/app/ui/lists/DEPRECATED_filter-badges/delete-filters.button';
import { Table } from './Table';
import { noFilters } from './filters';
import { useTableData } from './useTableData';

export const AuditSuivi = () => {
  const tableData = useTableData();
  const { setFilters, filtersCount } = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';

  return (
    <>
      <div className="mb-6">
        {filtersCount} {labelFilters}
        {filtersCount > 0 && (
          <DeleteFiltersButton
            className="ml-5"
            onClick={() => setFilters(noFilters)}
          />
        )}
      </div>
      <Table tableData={tableData} />
    </>
  );
};
