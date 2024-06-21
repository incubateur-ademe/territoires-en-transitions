import {useTableData} from './useTableData';
import {DetailTacheTable} from './DetailTacheTable';
import {noFilters} from './filters';
import {DisableAllFilters} from 'ui/buttons/DisableAllFilters';

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
      <div className="flex gap-4 mb-6">
        <div>
          {filtersCount} {labelFilters} ; {sousActionsCount} {labelSousActions}{' '}
          sur {sousActionsTotal} ; {count} {labelTaches} sur {total}
        </div>

        <DisableAllFilters
          hidden={!filtersCount}
          onClick={() => setFilters(noFilters)}
        />
      </div>
      <DetailTacheTable tableData={tableData} />
    </>
  );
};

export default DetailTaches;
