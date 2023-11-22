import {ToolbarIconButton} from 'ui/buttons/ToolbarIconButton';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import {useExportIndicateurs} from '../useExportIndicateurs';
import {FilterSummary} from './FilterSummary';
import {IndicateurViewParamOption} from 'app/paths';
import {FiltresIndicateurs} from './FiltresIndicateurs';
import {useFilteredIndicateurDefinitions} from './useFilteredIndicateurDefinitions';
import {useIndicateursFilterState} from './useIndicateursFilterState';

/** Affiche les filtres et la grille d'indicateurs donnés */
export const FiltersAndGrid = ({view}: {view: IndicateurViewParamOption}) => {
  const filterState = useIndicateursFilterState();
  const {filters, resetFilterParams, filterParamsCount} = filterState;

  // charge et filtre les définitions
  const {data: definitions} = useFilteredIndicateurDefinitions(view, filters);

  const {mutate: exportIndicateurs, isLoading} = useExportIndicateurs(
    definitions,
    view
  );

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
            {definitions?.length ? (
              <ToolbarIconButton
                className="fr-mr-1w"
                disabled={isLoading}
                icon="download"
                title={`Exporter ${definitions.length} indicateur${
                  definitions.length > 1 ? 's' : ''
                }`}
                onClick={() => exportIndicateurs()}
              />
            ) : null}
          </div>

          <IndicateurChartsGrid definitions={definitions} view={view} />
        </>
      )}
    </>
  );
};
