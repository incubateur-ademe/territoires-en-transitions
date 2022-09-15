import {useTableData} from './useTableData';
import {Table} from './Table';
import {noFilters} from './filters';
import {getMaxDepth} from './queries';
import {useReferentielId} from 'core-logic/hooks/params';
import {getFilterInfoMessage} from '../AidePriorisation/filters';
import {ColumnSelector} from './ColumnSelector';

const Progression = () => {
  const tableData = useTableData();
  const referentiel = useReferentielId();
  const {setFilters, filtersCount, options, setOptions} = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const filterInfoMessage = getFilterInfoMessage(
    filtersCount,
    getMaxDepth(referentiel)
  );
  const {visibleColumns} = options;

  return (
    <>
      <div className="flex items-center mb-6">
        <ColumnSelector
          selectedColumns={visibleColumns}
          setSelectedColumns={visibleColumns => setOptions({visibleColumns})}
        />
        <div className="pl-12">
          {filtersCount} {labelFilters}
          {filtersCount > 0 ? (
            <button
              className="fr-link fr-link--icon-left fr-fi-close-circle-fill fr-ml-2w"
              onClick={() => setFilters(noFilters)}
            >
              Désactiver tous les filtres
            </button>
          ) : null}
        </div>
      </div>
      {filterInfoMessage ? <p>{filterInfoMessage}</p> : null}
      <Table tableData={tableData} />
    </>
  );
};

export default Progression;
