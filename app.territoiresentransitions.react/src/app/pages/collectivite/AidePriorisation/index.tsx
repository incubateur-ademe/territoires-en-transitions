import {ITEM_ALL} from 'ui/shared/MultiSelectFilter';
import {useTableData} from './useTableData';
import {Table} from './Table';
import {initialFilters} from './filters';

export default () => {
  const tableData = useTableData();
  const {filters, setFilters} = tableData;
  const countFilters = Object.values(filters).reduce(
    (cnt, f) => cnt + filterLength(f),
    0
  );
  const labelFilters = countFilters > 1 ? 'filtres actifs' : 'filtre actif';

  return (
    <>
      <p>
        {countFilters} {labelFilters}
        {countFilters > 0 ? (
          <button
            className="fr-link fr-link--icon-left fr-fi-close-circle-fill fr-ml-2w"
            onClick={() => setFilters(initialFilters)}
          >
            Désactiver tous les filtres
          </button>
        ) : null}
      </p>
      <Table tableData={tableData} />
    </>
  );
};

const filterLength = (filters: string[]) =>
  filters?.length && !filters.includes(ITEM_ALL) ? filters.length : 0;
