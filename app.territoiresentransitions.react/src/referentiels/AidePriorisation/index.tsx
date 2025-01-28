'use client';

import { DesactiverLesFiltres } from '@/app/ui/shared/filters/DesactiverLesFiltres';
import { useReferentielId } from '../referentiel-context';
import { Table } from './Table';
import { getFilterInfoMessage, noFilters } from './filters';
import { getMaxDepth } from './queries';
import { useTableData } from './useTableData';

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
      <p>
        {filtersCount} {labelFilters}
        {filtersCount > 0 && (
          <DesactiverLesFiltres
            className="ml-5"
            onClick={() => setFilters(noFilters)}
          />
        )}
        {filterInfoMessage ? (
          <>
            <br />
            {filterInfoMessage}
          </>
        ) : null}
      </p>
      <Table tableData={tableData} />
    </>
  );
};

export default AidePriorisation;
