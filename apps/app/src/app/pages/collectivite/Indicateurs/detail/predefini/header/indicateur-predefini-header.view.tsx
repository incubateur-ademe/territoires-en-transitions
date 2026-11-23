import { useCurrentCollectivite } from '@tet/api/collectivites';
import { IndicateurChartInfo } from '../../../data/use-indicateur-chart';
import { useIndicateurData } from '../../context/indicateur-data.context';
import IndicateurHeader from '../../header/indicateur-header.view';
import {
  hasIndicateurInfos,
  IndicateurInfos,
} from '../../header/indicateur-infos.view';
import IndicateurToolbar from '../../header/indicateur-toolbar.view';

type Props = {
  chartInfo?: IndicateurChartInfo;
  isComposeSansAgregation: boolean;
};

export const IndicateurPredefiniHeader = ({
  chartInfo,
  isComposeSansAgregation,
}: Props) => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const infosProps = {
    indicateur,
    hasPersoBadge: false,
    isComposeSansAgregation,
    isReadonly: !canMutateIndicateur,
  };

  return (
    <IndicateurHeader
      collectiviteId={collectiviteId}
      hasCollectivitePermission={hasCollectivitePermission}
      indicateur={indicateur}
      isReadonly={!canMutateIndicateur}
      isTitleEditable={false}
      hasUniteSuffix={!isComposeSansAgregation}
      toolbar={
        <IndicateurToolbar
          chartInfo={chartInfo}
          hasCollectivitePermission={hasCollectivitePermission}
          canDelete={false}
        />
      }
      infos={<IndicateurInfos {...infosProps} />}
      hasInfos={hasIndicateurInfos(infosProps)}
    />
  );
};
