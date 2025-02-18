import { Indicateurs } from '@/api';
import { ExportIndicateursPageName } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import FilterBadges, {
  CustomFilterBadges,
  useFiltersToBadges,
} from '@/app/ui/lists/filter-badges';
import ExportButton from './export-button';

type Props = {
  pageName?: ExportIndicateursPageName; // tracking
  definitions?: Indicateurs.domain.IndicateurListItem[];
  filters: Indicateurs.FetchFiltre;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  isLoading: boolean;
  isEmpty: boolean;
};

const BadgeList = ({
  pageName,
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
  const displayExportButton = !isEmpty && !isLoading && !!pageName;

  if (!displayBadgesList && !pageName) return null;

  return (
    <div className="flex flex-row justify-between items-start">
      {displayBadgesList && (
        <FilterBadges badges={filterBadges} resetFilters={resetFilters} />
      )}
      {displayExportButton && (
        <ExportButton
          {...{ pageName, definitions }}
          isFiltered={!!filterBadges && filterBadges.length > 0}
        />
      )}
    </div>
  );
};

export default BadgeList;
