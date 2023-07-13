import {useIndicateursParentsSelection} from '../useIndicateurDefinitions';
import {useFilteredDefinitions} from './useFilteredDefinitions';
import {FiltersAndGrid} from './FiltersAndGrid';

/** Affiche les indicateurs marqués "sélection" */
export const IndicateursSelectionList = () => {
  // charge et filtre les définitions
  const filteredDefinitions = useFilteredDefinitions({
    definitions: useIndicateursParentsSelection(),
    defaultOptionLabel: 'Tous les indicateurs',
    addThematiqueOptions: true,
  });

  return <FiltersAndGrid filteredDefinitions={filteredDefinitions} />;
};
