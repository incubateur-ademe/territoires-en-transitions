import { Modal } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import IndicateurChartNew, { IndicateurChartData } from './IndicateurChartNew';

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
        <IndicateurChartNew
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
