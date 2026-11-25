import { PermissionOperation } from '@tet/domain/users';
import { IndicateurChartInfo } from '../../../data/use-indicateur-chart';
import { useIndicateurData } from '../../context/indicateur-data.context';
import IndicateurToolbar from '../../header/indicateur-toolbar.view';
import { useIndicateurNouveauSousIndicateur } from '../../context/indicateur-nouveau-sous-indicateur.context';
import { CreateSousIndicateurButton } from '../../content/sous-indicateurs/create-sous-indicateur.button';
import { IndicateurSousIndicateursChartPngExport } from '../../content/sous-indicateurs/indicateur-sous-indicateurs-chart.png-export';

type Props = {
  chartInfo?: IndicateurChartInfo;
  hasCollectivitePermission: (permission: PermissionOperation) => boolean;
};

export const IndicateurPersoToolbar = ({
  chartInfo,
  hasCollectivitePermission,
}: Props) => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { onCreated } = useIndicateurNouveauSousIndicateur();
  const hasSousIndicateurs = indicateur.enfants.length > 0;

  return (
    <IndicateurToolbar
      chartInfo={chartInfo}
      hasCollectivitePermission={hasCollectivitePermission}
      canDelete
      startAction={
        canMutateIndicateur ? (
          <CreateSousIndicateurButton
            variant="primary"
            size="xs"
            parentId={indicateur.id}
            childCount={indicateur.enfants.length}
            onCreated={onCreated}
          />
        ) : undefined
      }
      renderPngExport={
        hasSousIndicateurs
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
