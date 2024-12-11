import classNames from 'classnames';

import { Indicateurs } from '@/api';
import {
  ExportIndicateursPageName,
  useExportIndicateurs,
} from '@/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import { Badge } from '@/ui';
import FilterBadges, {
  CustomFilterBadges,
  useFiltersToBadges,
} from 'ui/shared/filters/filter-badges';

type Props = {
  pageName: ExportIndicateursPageName; // tracking
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
  // fonction d'export
  const { mutate: exportIndicateurs, isLoading: isDownloadingExport } =
    useExportIndicateurs(pageName, definitions);

  const { data: filterBadges } = useFiltersToBadges({
    filters,
    customValues: customFilterBadges,
  });

  return (
    <div className="flex flex-row justify-between items-start">
      {!!filterBadges?.length && (
        <FilterBadges badges={filterBadges} resetFilters={resetFilters} />
      )}
      {!isEmpty && !isLoading && (
        <button
          className={classNames('shrink-0 ml-auto', {
            'opacity-50': isDownloadingExport,
          })}
          disabled={isDownloadingExport}
          onClick={() => exportIndicateurs()}
        >
          <Badge
            className="py-4"
            icon="download-line"
            iconPosition="left"
            title={
              filterBadges?.length
                ? 'Exporter le résultat de mon filtre en Excel'
                : 'Exporter tous les indicateurs en Excel'
            }
            state="default"
            uppercase={false}
            size="sm"
          />
        </button>
      )}
    </div>
  );
};

export default BadgeList;
