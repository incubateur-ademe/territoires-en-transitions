import { useExportIndicateurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import { appLabels } from '@/app/labels/catalog';
import {
  ListIndicateursInputFilters,
  ListIndicateursInputSort,
} from '@tet/domain/indicateurs';
import { Badge, cn } from '@tet/ui';

type SortItem = { field: ListIndicateursInputSort; direction: 'asc' | 'desc' };

type Props = {
  filters?: ListIndicateursInputFilters;
  sort?: SortItem[];
  isFiltered: boolean;
};

const ExportButton = ({ filters, sort, isFiltered }: Props) => {
  const { mutate: exportIndicateurs, isPending: isDownloadingExport } =
    useExportIndicateurs({ mode: 'all', filters, sort });

  return (
    <button
      data-test="indicateurs.liste.exporter-excel"
      className={cn('shrink-0 ml-auto', {
        'opacity-50': isDownloadingExport,
      })}
      disabled={isDownloadingExport}
      onClick={() => exportIndicateurs()}
    >
      <Badge
        icon="download-line"
        iconPosition="left"
        title={
          isFiltered
            ? appLabels.exporterIndicateursFiltresExcel
            : appLabels.exporterTousIndicateursExcel
        }
        variant="grey"
        type="outlined"
        uppercase={false}
        size="sm"
      />
    </button>
  );
};

export default ExportButton;
