import { Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import IndicateurChart from './IndicateurChart';

type Props = {
  openState: OpenState;
  chartInfo: IndicateurChartInfo;
  isLoading: boolean;
  title?: string;
};

const DownloadIndicateurChartModal = ({
  openState,
  chartInfo,
  isLoading,
  title,
}: Props) => {
  if (!openState.isOpen) return null;

  return (
    <Modal
      size="xl"
      openState={openState}
      render={() => (
        <IndicateurChart
          chartInfo={chartInfo}
          isLoading={isLoading}
          title={title}
          variant="modal"
        />
      )}
    />
  );
};

export default DownloadIndicateurChartModal;
