import { IndicateurFilterBadges } from '@/app/indicateurs/indicateurs/indicateur-filter-badges';
import { useIndicateurFilterCategories } from '@/app/indicateurs/indicateurs/use-indicateur-filter-categories';
import {
  ListIndicateursInputFilters,
  ListIndicateursInputSort,
} from '@tet/domain/indicateurs';
import ExportButton from './export-button';

type SortItem = { field: ListIndicateursInputSort; direction: 'asc' | 'desc' };

type Props = {
  /** Filtres affichés en badges (sans les filtres par défaut de la vue) */
  filters: ListIndicateursInputFilters;
  /** Filtres complets à envoyer à l'export (incluant les filtres par défaut) */
  exportFilters?: ListIndicateursInputFilters;
  exportSort?: SortItem[];
  onFiltersChange: (filters: ListIndicateursInputFilters) => void;
  resetFilters?: () => void;
  isLoading: boolean;
  isEmpty: boolean;
};

const BadgeList = ({
  filters,
  exportFilters,
  exportSort,
  onFiltersChange,
  resetFilters,
  isEmpty,
  isLoading,
}: Props) => {
  const { categories: filterCategories } =
    useIndicateurFilterCategories(filters);

  const displayBadgesList = filterCategories.length > 0;

  const displayExportButton = !isEmpty && !isLoading;
  if (!displayBadgesList && !displayExportButton) return null;

  return (
    <div className="flex flex-row justify-between items-start">
      {displayBadgesList && (
        <IndicateurFilterBadges
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearAllFilters={resetFilters}
        />
      )}
      {displayExportButton && (
        <ExportButton
          filters={exportFilters}
          sort={exportSort}
          isFiltered={filterCategories.length > 0}
        />
      )}
    </div>
  );
};

export default BadgeList;
