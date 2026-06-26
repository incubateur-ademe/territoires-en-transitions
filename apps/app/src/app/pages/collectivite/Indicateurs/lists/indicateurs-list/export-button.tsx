import { useExportIndicateurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import { ListDefinitionsInputFilters } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { appLabels } from '@/app/labels/catalog';
import { ListDefinitionsInputSort } from '@tet/domain/indicateurs';
import { Badge } from '@tet/ui';
import classNames from 'classnames';

type SortItem = { field: ListDefinitionsInputSort; direction: 'asc' | 'desc' };

type Props = {
  filters?: ListDefinitionsInputFilters;
  sort?: SortItem[];
  isFiltered: boolean;
};

const ExportButton = ({ filters, sort, isFiltered }: Props) => {
  const { mutate: exportIndicateurs, isPending: isDownloadingExport } =
    useExportIndicateurs({ mode: 'all', filters, sort });

  return (
    <button
      data-test="indicateurs.liste.exporter-excel"
      className={classNames('shrink-0 ml-auto', {
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
        size="xs"
      />
    </button>
  );
};

export default ExportButton;
