import { Modal } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import IndicateurChart, { IndicateurChartData } from './IndicateurChart';

type Props = {
  openState: OpenState;
  data: IndicateurChartData;
  isLoading: boolean;
  title?: string;
};

const DownloadIndicateurChartModal = ({
  openState,
  data,
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
          data={data}
          isLoading={isLoading}
          title={title}
          variant="modal"
        />
      )}
    />
  );
};

export default DownloadIndicateurChartModal;
