import {useTableData} from './useTableData';
import {Table} from './Table';
import {noFilters} from './filters';
import {DisableAllFilters} from 'ui/buttons/DisableAllFilters';

const AuditSuivi = () => {
  const tableData = useTableData();
  const {setFilters, filtersCount} = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';

  return (
    <>
      <p>
        {filtersCount} {labelFilters}
        <DisableAllFilters
          filtersCount={filtersCount}
          onClick={() => setFilters(noFilters)}
        />
      </p>
      <Table tableData={tableData} />
    </>
  );
};

export default AuditSuivi;
