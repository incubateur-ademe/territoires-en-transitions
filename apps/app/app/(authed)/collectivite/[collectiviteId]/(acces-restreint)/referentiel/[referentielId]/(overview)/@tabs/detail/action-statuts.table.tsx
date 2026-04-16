'use client';

import { appLabels } from '@/app/labels/catalog';
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

  const stats = appLabels.statistiquesDetailTaches({
    filtresActifs: appLabels.filtreActif({ count: filtersCount }),
    sousActions: appLabels.sousAction({ count: sousActionsCount ?? 0 }),
    sousActionsTotal,
    taches: appLabels.tache({ count: count ?? 0 }),
    tachesTotal: total,
  });

  return (
    <>
      <div className="mb-6">
        {stats}
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
