import {useTableData} from './useTableData';
import {DetailTacheTable} from './DetailTacheTable';
import {noFilters} from './filters';
import {DisableAllFilters} from '../ReferentielTable/DisableAllFilters';

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
        <DisableAllFilters
          filtersCount={filtersCount}
          onClick={() => setFilters(noFilters)}
        />
      </p>
      <DetailTacheTable tableData={tableData} />
    </>
  );
};

export default DetailTaches;
