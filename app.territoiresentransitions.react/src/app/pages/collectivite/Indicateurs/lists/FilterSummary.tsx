import {DisableAllFilters} from 'ui/buttons/DisableAllFilters';
import {ITEM_ALL} from 'ui/shared/filters/commons';

/**
 * Affiche le nombre de résultats du filtrage et un bouton pour réinitialiser les filtres
 */
export const FilterSummary = ({
  count,
  resetSelection,
  selection,
}: {
  count: number;
  resetSelection: () => void;
  selection: string[];
}) => (
  <div className="flex flex-row">
    <span className="fr-mr-2w">{getLabel(count, selection)}</span>
    {count && !selection.includes(ITEM_ALL) ? (
      <DisableAllFilters
        filtersCount={selection?.length}
        onClick={resetSelection}
        label="Réinitialiser les filtres"
      />
    ) : null}
  </div>
);

const getLabel = (count: number, selection: string[]) => {
  if (!count) return '';
  if (selection.includes(ITEM_ALL)) {
    return `${count} indicateur${count > 1 ? 's' : ''}`;
  }
  return `${count} ${count > 1 ? 'indicateurs trouvés' : 'indicateur trouvé'}`;
};
