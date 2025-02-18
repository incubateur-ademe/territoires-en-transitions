'use client';

import { useTableData } from '@/app/referentiels/DetailTaches/useTableData';
import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import { useReferentielId } from '../referentiel-context';
import { Table } from './Table';
import { getFilterInfoMessage, noFilters } from './filters';
import { getMaxDepth } from './queries';

const AidePriorisation = () => {
  const referentielId = useReferentielId();
  const tableData = useTableData();
  const { setFilters, filtersCount } = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const filterInfoMessage = getFilterInfoMessage(
    filtersCount,
    getMaxDepth(referentielId)
  );

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-6">
          <span>
            {filtersCount} {labelFilters}
          </span>
          {filtersCount > 0 && (
            <DeleteFiltersButton onClick={() => setFilters(noFilters)} />
          )}
        </div>
        {filterInfoMessage && <p className="mb-0">{filterInfoMessage}</p>}
      </div>
      <Table tableData={tableData} />
    </>
  );
};

export default AidePriorisation;
