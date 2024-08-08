import {ID_NOUVEAU} from 'app/pages/collectivite/Indicateurs/Indicateurs';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import Link from 'next/link';
import {FilterSummary} from './FilterSummary';
import {FiltresIndicateurs} from './FiltresIndicateurs';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import {useFilteredIndicateurDefinitions} from './useFilteredIndicateurDefinitions';
import {useIndicateursFilterState} from './useIndicateursFilterState';

/** Affiche les filtres et la grille d'indicateurs donnés */
export const FiltersAndGrid = ({view}: {view: IndicateurViewParamOption}) => {
  const collectivite = useCurrentCollectivite();
  const filterState = useIndicateursFilterState();
  const {filters, resetFilterParams, filterParamsCount} = filterState;

  // charge et filtre les définitions
  const {data: definitions} = useFilteredIndicateurDefinitions(view, filters);

  // route non valide
  if (!collectivite) {
    return null;
  }

  // affiche un CTA quand il n'y a encore aucun indicateur perso
  if (
    view === 'perso' &&
    definitions?.length === 0 &&
    !filterParamsCount &&
    !collectivite.readonly
  ) {
    return (
      <div className="flex flex-col items-center mt-8 gap-8">
        <p>Aucun indicateur personnalisé</p>
        <Link
          className="fr-btn"
          href={makeCollectiviteIndicateursUrl({
            collectiviteId: collectivite.collectivite_id,
            indicateurView: 'perso',
            indicateurId: ID_NOUVEAU,
          })}
        >
          Créer un indicateur
        </Link>
      </div>
    );
  }

  return (
    <>
      {view !== 'cles' && (
        <FiltresIndicateurs view={view} state={filterState} />
      )}
      {definitions && (
        <>
          <div className="flex flex-row items-center justify-between fr-mb-3w">
            <FilterSummary
              count={definitions.length}
              resetFilterParams={resetFilterParams}
              filterParamsCount={filterParamsCount}
            />
          </div>

          <IndicateurChartsGrid definitions={definitions} view={view} />
        </>
      )}
    </>
  );
};
