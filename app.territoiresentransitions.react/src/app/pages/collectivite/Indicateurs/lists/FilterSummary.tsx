import {DisableAllFilters} from 'ui/buttons/DisableAllFilters';

/**
 * Affiche le nombre de résultats du filtrage et un bouton pour réinitialiser les filtres
 */
export const FilterSummary = ({
  count,
  resetFilterParams,
  filterParamsCount,
}: {
  count: number;
  resetFilterParams: () => void;
  filterParamsCount: number;
}) => (
  <div className="flex flex-row">
    <span className="fr-mr-2w">{getLabel(count, filterParamsCount)}</span>
    {filterParamsCount ? (
      <DisableAllFilters
        filtersCount={filterParamsCount}
        onClick={resetFilterParams}
        label="Réinitialiser les filtres"
      />
    ) : null}
  </div>
);

const getLabel = (count: number, filterParamsCount: number) => {
  if (!count) return 'Aucun indicateur trouvé';
  if (!filterParamsCount) {
    return `${count} indicateur${count > 1 ? 's' : ''}`;
  }
  return `${count} ${count > 1 ? 'indicateurs trouvés' : 'indicateur trouvé'}`;
};
