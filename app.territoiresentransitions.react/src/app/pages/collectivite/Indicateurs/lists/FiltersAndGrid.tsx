import MultiTagFilters from 'ui/shared/filters/MultiTagFilters';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import {TFilteredDefinitions} from './useFilteredDefinitions';
import {FilterSummary} from './FilterSummary';

/** Affiche les filtres et la grille d'indicateurs donnés */
export const FiltersAndGrid = ({
  filteredDefinitions,
}: {
  /** données fournies par `useFilteredDefinitions` */
  filteredDefinitions: TFilteredDefinitions;
}) => {
  // charge et filtre les définitions
  const {
    definitions,
    options,
    optionsWithoutResults,
    selection,
    updateSelection,
    resetSelection,
  } = filteredDefinitions;

  return (
    <>
      <MultiTagFilters
        className="fr-mb-4w"
        options={options}
        disabledOptions={optionsWithoutResults}
        values={selection}
        onChange={updateSelection}
      />
      <FilterSummary
        count={definitions.length}
        resetSelection={resetSelection}
        selection={selection}
      />
      <IndicateurChartsGrid definitions={definitions} />
    </>
  );
};
