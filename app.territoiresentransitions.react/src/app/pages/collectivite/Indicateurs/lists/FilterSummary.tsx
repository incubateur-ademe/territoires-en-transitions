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
}) =>
  count && !selection.includes(ITEM_ALL) ? (
    <p>
      <span className="fr-mr-2w">
        {count} {count > 1 ? 'indicateurs trouvés' : 'indicateur trouvé'}
      </span>
      <DisableAllFilters
        filtersCount={selection?.length}
        onClick={resetSelection}
        label="Réinitialiser les filtres"
      />
    </p>
  ) : null;
