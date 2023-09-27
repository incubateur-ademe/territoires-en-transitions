import MultiTagFilters from 'ui/shared/filters/MultiTagFilters';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import {TFilteredDefinitions} from './useFilteredDefinitions';
import {useExportIndicateurs} from '../useExportIndicateurs';
import {FilterSummary} from './FilterSummary';
import {IndicateurViewParamOption} from 'app/paths';
import {ToolbarIconButton} from 'ui/buttons/ToolbarIconButton';

/** Affiche les filtres et la grille d'indicateurs donnés */
export const FiltersAndGrid = ({
  filteredDefinitions,
  view,
}: {
  /** données fournies par `useFilteredDefinitions` */
  filteredDefinitions: TFilteredDefinitions;
  view?: IndicateurViewParamOption;
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
  const {mutate: exportIndicateurs, isLoading} = useExportIndicateurs(
    definitions,
    view
  );

  return (
    <>
      <MultiTagFilters
        className="fr-mb-4w"
        options={options}
        disabledOptions={optionsWithoutResults}
        values={selection}
        onChange={updateSelection}
      />
      <div className="flex flex-row items-center justify-between fr-mb-3w">
        <FilterSummary
          count={definitions.length}
          resetSelection={resetSelection}
          selection={selection}
        />
        <ToolbarIconButton
          className="fr-mr-1w"
          disabled={isLoading}
          icon="download"
          title="Exporter"
          onClick={() => exportIndicateurs()}
        />
      </div>
      <IndicateurChartsGrid definitions={definitions} view={view} />
    </>
  );
};
