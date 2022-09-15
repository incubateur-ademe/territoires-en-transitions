import {useTableData} from './useTableData';
import {Table} from './Table';
import {getFilterInfoMessage, noFilters} from './filters';
import {getMaxDepth} from './queries';
import {useReferentielId} from 'core-logic/hooks/params';

const AidePriorisation = () => {
  const tableData = useTableData();
  const referentiel = useReferentielId();
  const {setFilters, filtersCount} = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const filterInfoMessage = getFilterInfoMessage(
    filtersCount,
    getMaxDepth(referentiel)
  );

  return (
    <>
      <p>
        {filtersCount} {labelFilters}
        {filtersCount > 0 ? (
          <button
            className="fr-link fr-link--icon-left fr-fi-close-circle-fill fr-ml-2w"
            onClick={() => setFilters(noFilters)}
          >
            Désactiver tous les filtres
          </button>
        ) : null}
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
