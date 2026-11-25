import { useCurrentCollectivite } from '@tet/api/collectivites';
import { IndicateurChartInfo } from '../../../data/use-indicateur-chart';
import { useIndicateurData } from '../../context/indicateur-data.context';
import IndicateurHeader from '../../header/indicateur-header.view';
import {
  hasIndicateurInfos,
  IndicateurInfos,
} from '../../header/indicateur-infos.view';
import { IndicateurPersoToolbar } from './indicateur-perso-toolbar.view';

type Props = {
  chartInfo: IndicateurChartInfo;
};

export const IndicateurPersoHeader = ({ chartInfo }: Props) => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const infosProps = {
    indicateur,
    hasPersoBadge: true,
    isReadonly: !canMutateIndicateur,
  };

  return (
    <IndicateurHeader
      collectiviteId={collectiviteId}
      hasCollectivitePermission={hasCollectivitePermission}
      indicateur={indicateur}
      isReadonly={!canMutateIndicateur}
      isTitleEditable
      hasUniteSuffix
      toolbar={
        <IndicateurPersoToolbar
          chartInfo={chartInfo}
          hasCollectivitePermission={hasCollectivitePermission}
        />
      }
      infos={<IndicateurInfos {...infosProps} />}
      hasInfos={hasIndicateurInfos(infosProps)}
    />
  );
};
