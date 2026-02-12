'use client';

import { DetailTacheTable } from '@/app/referentiels/DetailTaches/DetailTacheTable';
import { noFilters } from '@/app/referentiels/DetailTaches/filters';
import { useTableData } from '@/app/referentiels/DetailTaches/useTableData';
import { DeleteFiltersButton } from '@/app/ui/lists/DEPRECATED_filter-badges/delete-filters.button';

export const ActionStatutsTable = () => {
  const tableData = useTableData();
  const {
    count,
    sousActionsCount,
    total,
    sousActionsTotal,
    setFilters,
    filtersCount,
  } = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const labelSousActions = `sous-action${sousActionsCount > 1 ? 's' : ''}`;
  const labelTaches = 'tâche' + (count > 1 ? 's' : '');

  return (
    <>
      <div className="mb-6">
        {filtersCount} {labelFilters} ; {sousActionsCount} {labelSousActions}{' '}
        sur {sousActionsTotal} ; {count} {labelTaches} sur {total}
        {filtersCount > 0 && (
          <DeleteFiltersButton
            className="ml-5"
            onClick={() => setFilters(noFilters)}
          />
        )}
      </div>
      <DetailTacheTable tableData={tableData} />
    </>
  );
};
