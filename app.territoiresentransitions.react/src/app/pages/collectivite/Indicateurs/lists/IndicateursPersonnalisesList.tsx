import {Link} from 'react-router-dom';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useIndicateursPersoDefinitions} from '../useIndicateursPersoDefinitions';
import {useFilteredDefinitions} from './useFilteredDefinitions';
import {FiltersAndGrid} from './FiltersAndGrid';

/** Affiche les indicateurs personnalisés */
export const IndicateursPersonnalisesList = () => {
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id;
  const isReadonly = collectivite?.readonly ?? true;

  // charge et filtre les définitions
  const filteredDefinitions = useFilteredDefinitions({
    definitions: useIndicateursPersoDefinitions(collectiviteId!) || [],
    defaultOptionLabel: 'Tous les indicateurs personnalisés',
  });

  if (!collectiviteId) return null;

  const {definitions} = filteredDefinitions;

  return (
    <>
      {definitions?.length ? (
        <FiltersAndGrid filteredDefinitions={filteredDefinitions} />
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
