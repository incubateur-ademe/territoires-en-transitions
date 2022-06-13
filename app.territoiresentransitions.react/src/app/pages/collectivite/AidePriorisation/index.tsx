import {useTableData} from './useTableData';
import {Table} from './Table';
import {initialFilters} from './filters';
import {getMaxDepth} from './queries';
import {useReferentielId} from 'core-logic/hooks/params';

export default () => {
  const tableData = useTableData();
  const referentiel = useReferentielId();
  const {setFilters, filtersCount} = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const filterInfoMessage =
    filtersCount > 0
      ? `Les filtres s‘appliquent au niveau des sous-actions (${Array(
          getMaxDepth(referentiel)
        )
          .fill('x')
          .join('.')})`
      : null;

  return (
    <>
      <p>
        {filtersCount} {labelFilters}
        {filtersCount > 0 ? (
          <button
            className="fr-link fr-link--icon-left fr-fi-close-circle-fill fr-ml-2w"
            onClick={() => setFilters(initialFilters)}
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
