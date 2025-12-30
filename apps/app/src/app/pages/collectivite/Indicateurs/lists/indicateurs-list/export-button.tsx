import { useExportIndicateurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { Badge } from '@tet/ui';
import classNames from 'classnames';

type Props = {
  definitions?: IndicateurDefinitionListItem[];
  isFiltered: boolean;
};

const ExportButton = ({ definitions, isFiltered }: Props) => {
  // fonction d'export
  const { mutate: exportIndicateurs, isPending: isDownloadingExport } =
    useExportIndicateurs(definitions);

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
