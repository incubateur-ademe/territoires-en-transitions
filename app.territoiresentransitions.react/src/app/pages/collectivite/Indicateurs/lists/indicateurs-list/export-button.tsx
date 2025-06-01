import { Indicateurs } from '@/api';
import { useExportIndicateurs } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import { Badge } from '@/ui';
import classNames from 'classnames';

type Props = {
  definitions?: Indicateurs.domain.IndicateurListItem[];
  isFiltered: boolean;
};

const ExportButton = ({ definitions, isFiltered }: Props) => {
  // fonction d'export
  const { mutate: exportIndicateurs, isLoading: isDownloadingExport } =
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
        className="py-4"
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
