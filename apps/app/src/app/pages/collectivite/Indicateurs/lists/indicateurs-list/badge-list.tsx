import {
  IndicateurDefinitionListItem,
  ListDefinitionsInputFilters,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { ListDefinitionsInputSort } from '@tet/domain/indicateurs';
import FilterBadges, {
  CustomFilterBadges,
  useFiltersToBadges,
} from '@/app/ui/lists/filter-badges';
import ExportButton from './export-button';

type Props = {
  definitions?: IndicateurDefinitionListItem[];
  /** Filtres pour l'affichage des badges (exclut les filtres par défaut) */
  filters: ListDefinitionsInputFilters;
  /** Filtres complets pour l'export (inclut les filtres par défaut) */
  exportFilters: ListDefinitionsInputFilters;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  isLoading: boolean;
  isEmpty: boolean;
  /** Nombre total d'indicateurs (filtrés ou non) pour l'export complet */
  count?: number;
  /** Tri appliqué à la liste pour l'export */
  sortBy?: ListDefinitionsInputSort;
};

const BadgeList = ({
  definitions,
  filters,
  exportFilters,
  customFilterBadges,
  resetFilters,
  isEmpty,
  isLoading,
  count,
  sortBy,
}: Props) => {
  const { data: filterBadges } = useFiltersToBadges({
    filters,
    customValues: customFilterBadges,
  });

  const displayBadgesList = !!filterBadges?.length;

  const displayExportButton = !isEmpty && !isLoading;
  if (!displayBadgesList && !displayExportButton) return null;

  return (
    <div className="flex flex-row justify-between items-start">
      {displayBadgesList && (
        <FilterBadges badges={filterBadges} resetFilters={resetFilters} />
      )}
      {displayExportButton && (
        <ExportButton
          definitions={definitions}
          filters={exportFilters}
          count={count}
          sortBy={sortBy}
          isFiltered={!!filterBadges}
        />
      )}
    </div>
  );
};

export default BadgeList;
