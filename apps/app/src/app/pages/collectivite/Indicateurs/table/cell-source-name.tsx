import { appLabels } from '@/app/labels/catalog';
import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { DashedLineSymbol, SolidLineSymbol } from '@/app/ui/charts/ChartLegend';
import { DEPRECATED_TCell, Icon } from '@tet/ui';
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
  source: PreparedData['sources'][number];
  unite: string;
  type: SourceType;
  getColorBySourceId: GetColorBySourceId;
}) => {
  const metadonnee = source.metadonnees?.[0];
  const color = getColorBySourceId(source.source, type);
  const label = getSourceLabel(
    source.source,
    metadonnee?.producteur || source.libelle,
    type
  );

  return (
    <DEPRECATED_TCell className="font-bold text-sm">
      <div className="inline-flex items-center min-w-72 gap-2">
        {type === 'objectif' ? DashedLineSymbol(color) : SolidLineSymbol(color)}
        {source.periodiciteSource
          ? appLabels.indicateurSourcePeriodicite(
              label,
              [
                getIndicateurPeriodPresentation(source.periodiciteSource).label,
                metadonnee?.nomDonnees,
                metadonnee?.dateVersion,
                metadonnee
                  ? appLabels.indicateurSourceVersion(metadonnee.id)
                  : undefined,
              ]
                .filter(Boolean)
                .join(' · ')
            )
          : label}
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
    </DEPRECATED_TCell>
  );
};
