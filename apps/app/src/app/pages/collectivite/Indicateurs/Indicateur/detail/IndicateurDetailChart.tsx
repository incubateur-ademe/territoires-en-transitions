import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { appLabels } from '@/app/labels/catalog';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { EmptyCard } from '@tet/ui';
import { uiLabels } from '@tet/ui/labels/catalog';
import classNames from 'classnames';
import IndicateurChart from '../../chart/IndicateurChart';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';

type Props = {
  definition: IndicateurDefinition;
  chartInfo: IndicateurChartInfo;
  className?: string;
  isReadonly?: boolean;
  onAddValue?: () => void;
};

/**
 *
 * Utilisé dans les pages indicateurs.
 */
const IndicateurDetailChart = ({
  definition,
  chartInfo,
  className,
  isReadonly = true,
  onAddValue,
}: Props) => {
  const { hasValeur, isLoading, sourceFilter } = chartInfo;

  return hasValeur ? (
    <div
      data-test={`chart-${definition.id}`}
      className={classNames('w-full', className)}
    >
      <IndicateurChart chartInfo={chartInfo} isLoading={isLoading} />
    </div>
  ) : (
    <EmptyCard
      size="xs"
      className="h-64 w-full"
      picto={(props) => <PictoIndicateurVide {...props} />}
      title={
        sourceFilter.avecDonneesCollectivite
          ? appLabels.aucuneValeurCollectivite
          : appLabels.aucuneValeurTrouvee
      }
      actions={
        sourceFilter.avecDonneesCollectivite
          ? !isReadonly && onAddValue
            ? [
                {
                  children: getIndicateurPeriodPresentation(
                    definition.periodicite
                  ).editor.addLabel,
                  onClick: () => onAddValue(),
                },
              ]
            : undefined
          : [
              {
                children: uiLabels.supprimerTousLesFiltres,
                onClick: () => sourceFilter.setFiltresSource([]),
              },
            ]
      }
    />
  );
};

export default IndicateurDetailChart;
