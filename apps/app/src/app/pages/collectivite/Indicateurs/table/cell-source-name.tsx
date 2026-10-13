import { appLabels } from '@/app/labels/catalog';
import { DashedLineSymbol, SolidLineSymbol } from '@/app/ui/charts/ChartLegend';
import { Icon, TableHeaderCell } from '@tet/ui';
import { getSourceLabel } from '../data/get-source-label';
import { PreparedData } from '../data/prepare-data';
import { GetColorBySourceId } from '../data/use-indicateur-sources';
import { DataSourceTooltip } from '../Indicateur/detail/DataSourceTooltip';
import { SourceType } from '../types';

/** Affiche le nom d'une source de données. */
export const CellSourceName = ({
  source,
  type,
  getColorBySourceId,
}: {
  source: Omit<PreparedData['sources'][number], 'valeurs'>;
  type: SourceType;
  getColorBySourceId: GetColorBySourceId;
}) => {
  const metadonnee = source.metadonnees?.[0];
  const color = getColorBySourceId(source.source, type);
  const isLocal = source.source === 'collectivite';

  return (
    <TableHeaderCell
      scope="row"
      className="border-b border-r border-primary-4 align-middle font-bold text-sm"
    >
      <div className="inline-flex items-center min-w-72 gap-2">
        {!isLocal &&
          (type === 'objectif'
            ? DashedLineSymbol(color)
            : SolidLineSymbol(color))}
        {isLocal
          ? appLabels.sourceCollectivite
          : getSourceLabel(
              source.source,
              metadonnee?.producteur || source.libelle,
              type
            )}
        {!!metadonnee && (
          <DataSourceTooltip
            nomSource={source.libelle}
            metadonnee={metadonnee}
            calculAuto={source.calculAuto}
          >
            <Icon
              icon="information-line"
              className="text-primary float-right"
            />
          </DataSourceTooltip>
        )}
      </div>
    </TableHeaderCell>
  );
};
