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
      <div className="flex gap-4 mb-6">
        {filtersCount} {labelFilters}
        <DisableAllFilters
          hidden={!filtersCount}
          onClick={() => setFilters(noFilters)}
        />
      </div>
      <Table tableData={tableData} />
    </>
  );
};

export default AuditSuivi;
