import { PermissionOperation } from '@tet/domain/users';
import { IndicateurChartInfo } from '../../../data/use-indicateur-chart';
import { IndicateurSousIndicateursChartPngExport } from '../../content/sous-indicateurs/indicateur-sous-indicateurs-chart.png-export';
import { useIndicateurData } from '../../context/indicateur-data.context';
import IndicateurToolbar from '../../header/indicateur-toolbar.view';
import { isComposeSansAgregation } from '../indicateur-predefini-compose.rules';

type Props = {
  chartInfo?: IndicateurChartInfo;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
};

export const IndicateurPredefiniToolbar = ({
  chartInfo,
  hasCollectivitePermission,
}: Props) => {
  const { indicateur } = useIndicateurData();

  return (
    <IndicateurToolbar
      chartInfo={chartInfo}
      hasCollectivitePermission={hasCollectivitePermission}
      canDelete={false}
      renderPngExport={
        isComposeSansAgregation(indicateur)
          ? ({ onDone }) => (
              <IndicateurSousIndicateursChartPngExport
                indicateurId={indicateur.id}
                unite={indicateur.unite}
                periodicite={indicateur.periodicite}
                title={indicateur.titre}
                onDone={onDone}
              />
            )
          : undefined
      }
    />
  );
};
