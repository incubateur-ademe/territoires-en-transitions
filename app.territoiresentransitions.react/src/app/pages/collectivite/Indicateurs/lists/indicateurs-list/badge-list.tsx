import { Indicateurs } from '@/api';
import FilterBadges, {
  CustomFilterBadges,
  useFiltersToBadges,
} from '@/app/ui/lists/filter-badges';
import { ListIndicateursRequestFilters } from '@/domain/indicateurs';
import ExportButton from './export-button';

type Props = {
  definitions?: Indicateurs.domain.IndicateurListItem[];
  filters: ListIndicateursRequestFilters;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  isLoading: boolean;
  isEmpty: boolean;
};

const BadgeList = ({
  definitions,
  filters,
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
        <FilterBadges badges={filterBadges} resetFilters={resetFilters} />
      )}
      {displayExportButton && (
        <ExportButton definitions={definitions} isFiltered={!!filterBadges} />
      )}
    </div>
  );
};

export default BadgeList;
