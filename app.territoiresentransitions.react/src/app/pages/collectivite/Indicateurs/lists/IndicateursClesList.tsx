import {useIndicateursParentsCles} from '../useIndicateurDefinitions';
import {useFilteredDefinitions} from './useFilteredDefinitions';
import {FiltersAndGrid} from './FiltersAndGrid';

/** Affiche les indicateurs clés */
export const IndicateursClesList = () => {
  // charge et filtre les définitions
  const filteredDefinitions = useFilteredDefinitions({
    definitions: useIndicateursParentsCles(),
    defaultOptionLabel: 'Tous les indicateurs clés',
  });

  return <FiltersAndGrid filteredDefinitions={filteredDefinitions} />;
};
