import MultiTagFilters from 'ui/shared/filters/MultiTagFilters';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import {useIndicateursParentsSelection} from './useIndicateurDefinitions';
import {useFilteredDefinitions} from './useFilteredDefinitions';
import {FilterSummary} from './FilterSummary';

export const IndicateursSelectionList = () => {
  // charge et filtre les définitions
  const {
    definitions,
    options,
    optionsWithoutResults,
    selection,
    updateSelection,
    resetSelection,
  } = useFilteredDefinitions({
    definitions: useIndicateursParentsSelection(),
    defaultOptionLabel: 'Tous les indicateurs',
    addThematiqueOptions: true,
  });

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
