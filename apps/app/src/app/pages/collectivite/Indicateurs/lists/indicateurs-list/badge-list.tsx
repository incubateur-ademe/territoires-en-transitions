import {
  ListDefinitionsInputFilters,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import DEPRECATED_FilterBadges, {
  CustomFilterBadges,
  useFiltersToBadges,
} from '@/app/ui/lists/DEPRECATED_filter-badges';
import { ListDefinitionsInputSort } from '@tet/domain/indicateurs';
import ExportButton from './export-button';

type SortItem = { field: ListDefinitionsInputSort; direction: 'asc' | 'desc' };

type Props = {
  /** Filtres affichés en badges (sans les filtres par défaut de la vue) */
  filters: ListDefinitionsInputFilters;
  /** Filtres complets à envoyer à l'export (incluant les filtres par défaut) */
  exportFilters?: ListDefinitionsInputFilters;
  exportSort?: SortItem[];
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  isLoading: boolean;
  isEmpty: boolean;
};

const BadgeList = ({
  filters,
  exportFilters,
  exportSort,
  customFilterBadges,
  resetFilters,
  isEmpty,
  isLoading,
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
        <DEPRECATED_FilterBadges
          badges={filterBadges}
          resetFilters={resetFilters}
        />
      )}
      {displayExportButton && (
        <ExportButton
          filters={exportFilters}
          sort={exportSort}
          isFiltered={!!filterBadges?.length}
        />
      )}
    </div>
  );
};

export default BadgeList;
