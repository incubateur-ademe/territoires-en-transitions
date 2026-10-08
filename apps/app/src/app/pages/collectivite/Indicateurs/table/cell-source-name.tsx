import { STICKY_LEFT_SHADOW_CLASSNAME } from '@/app/indicateurs/valeurs/grid/scroll-shadow';
import { DashedLineSymbol, SolidLineSymbol } from '@/app/ui/charts/ChartLegend';
import { Icon, TableHeaderCell } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { getSourceLabel } from '../data/get-source-label';
import { PreparedData } from '../data/prepare-data';
import { GetColorBySourceId } from '../data/use-indicateur-sources';
import { DataSourceTooltip } from '../Indicateur/detail/DataSourceTooltip';
import { SourceType } from '../types';

/** Affiche le nom d'une source de données et un rappel de l'unité */
export const CellSourceName = ({
  source,
  unite,
  type,
  getColorBySourceId,
}: {
  source: Omit<PreparedData['sources'][number], 'valeurs'>;
  unite: string;
  type: SourceType;
  getColorBySourceId: GetColorBySourceId;
}) => {
  const metadonnee = source.metadonnees?.[0];
  const color = getColorBySourceId(source.source, type);

  return (
    <TableHeaderCell
      scope="row"
      pinnedLeft
      className={cn(
        'border-b border-grey-3 font-bold text-sm',
        STICKY_LEFT_SHADOW_CLASSNAME
      )}
    >
      <div className="inline-flex items-center min-w-72 gap-2">
        {type === 'objectif' ? DashedLineSymbol(color) : SolidLineSymbol(color)}
        {getSourceLabel(
          source.source,
          metadonnee?.producteur || source.libelle,
          type
        )}
        <sup className="text-primary-9 leading-tight">{`(${unite})`}</sup>
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
