import { DesactiverLesFiltres } from '@/app/ui/shared/filters/DesactiverLesFiltres';
import { Table } from './Table';
import { noFilters } from './filters';
import { useTableData } from './useTableData';

const AuditSuivi = () => {
  const tableData = useTableData();
  const { setFilters, filtersCount } = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';

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
      </p>
      <Table tableData={tableData} />
    </>
  );
};

export default AuditSuivi;
