import { useExportIndicateurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import {
  IndicateurDefinitionListItem,
  ListDefinitionsInputFilters,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { ListDefinitionsInputSort } from '@tet/domain/indicateurs';
import { Badge } from '@tet/ui';
import classNames from 'classnames';

type Props = {
  definitions?: IndicateurDefinitionListItem[];
  filters?: ListDefinitionsInputFilters;
  count?: number;
  sortBy?: ListDefinitionsInputSort;
  isFiltered: boolean;
};

const ExportButton = ({
  definitions,
  filters,
  count,
  sortBy,
  isFiltered,
}: Props) => {
  // fonction d'export - utilise filters+count pour exporter tout le résultat du filtre
  const { mutate: exportIndicateurs, isPending: isDownloadingExport } =
    useExportIndicateurs({ definitions, filters, count, sortBy });

  return (
    <button
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
            ? 'Exporter le résultat de mon filtre en Excel'
            : 'Exporter tous les indicateurs en Excel'
        }
        state="default"
        uppercase={false}
        size="sm"
      />
    </button>
  );
};

export default ExportButton;
