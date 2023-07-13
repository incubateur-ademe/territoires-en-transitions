import {Link} from 'react-router-dom';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useIndicateursPersoDefinitions} from './useIndicateursPersoDefinitions';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import {useFilteredDefinitions} from './useFilteredDefinitions';
import MultiTagFilters from 'ui/shared/filters/MultiTagFilters';
import {FilterSummary} from './FilterSummary';

export const IndicateursPersonnalisesList = () => {
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id;
  const isReadonly = collectivite?.readonly ?? true;

  // charge et filtre les définitions
  const {
    definitions,
    options,
    optionsWithoutResults,
    selection,
    updateSelection,
    resetSelection,
  } = useFilteredDefinitions({
    definitions: useIndicateursPersoDefinitions(collectiviteId!) || [],
    defaultOptionLabel: 'Tous les indicateurs personnalisés',
  });

  if (!collectiviteId) return null;

  return (
    <>
      {definitions?.length ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center">
          <p className="fr-my-8w">Aucun indicateur personnalisé</p>
          {!isReadonly && (
            <Link
              className="fr-btn"
              to={makeCollectiviteIndicateursUrl({
                collectiviteId,
                indicateurView: 'perso',
                indicateurId: 'nouveau',
              })}
            >
              Créer un indicateur
            </Link>
          )}
        </div>
      )}
    </>
  );
};
