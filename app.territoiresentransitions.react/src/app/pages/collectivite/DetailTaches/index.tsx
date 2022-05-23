import {useTableData} from './useTableData';
import {DetailTacheTable} from './DetailTacheTable';

export default () => {
  const tableData = useTableData();
  const {count, total, filters, setFilters} = tableData;
  const countFilters =
    filters?.length && !filters.includes('tous') ? filters.length : 0;
  const labelFilters = countFilters > 1 ? 'filtres actifs' : 'filtre actif';
  const labelTaches = 'tâche' + (count > 1 ? 's' : '');

  return (
    <>
      <p>
        {countFilters} {labelFilters} ; {count} {labelTaches} sur {total}
        {countFilters > 0 ? (
          <button
            className="fr-link fr-link--icon-left fr-fi-close-circle-fill fr-ml-2w"
            onClick={() => setFilters(['tous'])}
          >
            Désactiver tous les filtres
          </button>
        ) : null}
      </p>
      <DetailTacheTable tableData={tableData} />
    </>
  );
};
