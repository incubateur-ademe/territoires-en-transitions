import { useTableData } from './useTableData';
import { Table } from './Table';
import { getFilterInfoMessage, noFilters } from './filters';
import { getMaxDepth } from './queries';
import { useReferentielId } from 'core-logic/hooks/params';
import { DesactiverLesFiltres } from 'ui/shared/filters/DesactiverLesFiltres';

const AidePriorisation = () => {
  const tableData = useTableData();
  const referentiel = useReferentielId();
  const { setFilters, filtersCount } = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const filterInfoMessage = getFilterInfoMessage(
    filtersCount,
    getMaxDepth(referentiel)
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
