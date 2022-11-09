import {useTableData} from './useTableData';
import {Table} from './Table';
import {noFilters} from './filters';

const AuditSuivi = () => {
  const tableData = useTableData();
  const {setFilters, filtersCount} = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';

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
      </p>
      <Table tableData={tableData} />
    </>
  );
};

export default AuditSuivi;
