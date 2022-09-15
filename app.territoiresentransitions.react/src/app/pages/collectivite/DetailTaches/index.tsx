import {useTableData} from './useTableData';
import {DetailTacheTable} from './DetailTacheTable';
import {noFilters} from './filters';

const DetailTaches = () => {
  const tableData = useTableData();
  const {count, total, setFilters, filtersCount} = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const labelTaches = 'tâche' + (count > 1 ? 's' : '');

  return (
    <>
      <p>
        {filtersCount} {labelFilters} ; {count} {labelTaches} sur {total}
        {filtersCount > 0 ? (
          <button
            className="fr-link fr-link--icon-left fr-fi-close-circle-fill fr-ml-2w"
            onClick={() => setFilters(noFilters)}
          >
            Désactiver tous les filtres
          </button>
        ) : null}
      </p>
      <DetailTacheTable tableData={tableData} />
    </>
  );
};

export default DetailTaches;
