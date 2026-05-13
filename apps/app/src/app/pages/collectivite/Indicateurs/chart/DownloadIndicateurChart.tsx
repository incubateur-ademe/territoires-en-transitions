import { Modal } from '@tet/ui/design-system/ModalNext/index';
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
    <Modal openState={openState} size="xl">
      <Modal.Body>
        <IndicateurChart
          chartInfo={chartInfo}
          isLoading={isLoading}
          title={title}
          variant="modal"
        />
      </Modal.Body>
    </Modal>
  );
};

export default DownloadIndicateurChartModal;
