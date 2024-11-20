import { useTableData } from './useTableData';
import { DetailTacheTable } from './DetailTacheTable';
import { noFilters } from './filters';
import { DesactiverLesFiltres } from 'ui/shared/filters/DesactiverLesFiltres';

const DetailTaches = () => {
  const tableData = useTableData();
  const {
    count,
    sousActionsCount,
    total,
    sousActionsTotal,
    setFilters,
    filtersCount,
  } = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const labelSousActions = `sous-action${sousActionsCount > 1 ? 's' : ''}`;
  const labelTaches = 'tâche' + (count > 1 ? 's' : '');

  return (
    <>
      <p>
        {filtersCount} {labelFilters} ; {sousActionsCount} {labelSousActions}{' '}
        sur {sousActionsTotal} ; {count} {labelTaches} sur {total}
        {filtersCount > 0 && (
          <DesactiverLesFiltres
            className="ml-5"
            onClick={() => setFilters(noFilters)}
          />
        )}
      </p>
      <DetailTacheTable tableData={tableData} />
    </>
  );
};

export default DetailTaches;
