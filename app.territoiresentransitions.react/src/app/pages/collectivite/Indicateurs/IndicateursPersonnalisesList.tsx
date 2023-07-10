import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIndicateursPersoDefinitions} from './useIndicateursPersoDefinitions';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import {useFilteredDefinitions} from './useFilteredDefinitions';
import MultiTagFilters from 'ui/shared/filters/MultiTagFilters';
import {FilterSummary} from './FilterSummary';

export const IndicateursPersonnalisesList = () => {
  const collectiviteId = useCollectiviteId()!;

  // charge et filtre les définitions
  const {
    definitions,
    options,
    optionsWithoutResults,
    selection,
    updateSelection,
    resetSelection,
  } = useFilteredDefinitions({
    definitions: useIndicateursPersoDefinitions(collectiviteId) || [],
    defaultOptionLabel: 'Tous les indicateurs personnalisés',
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
      <IndicateurChartsGrid definitions={definitions || []} />
    </>
  );
};
