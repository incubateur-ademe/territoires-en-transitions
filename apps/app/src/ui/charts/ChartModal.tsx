import { appLabels } from '@/app/labels/catalog';
import DownloadCanvasButton from '@/app/ui/buttons/DownloadCanvasButton';

import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useRef } from 'react';
import { ChartProps } from './Chart';
import DonutChart from './Donut/DonutChart';

/** Modale qui présente le graphique complet et permet de le télécharger */
const ChartModal = (props: ChartProps) => {
  const { infos, donut, onDownload } = props;
  const modal = infos?.modal;
  const snapshotRef = useRef<HTMLDivElement>(null);

  const legendBase = {
    isOpen: true,
    className: 'mt-6',
  };

  if (!infos || !modal) return null;

  return (
    <Modal
      size={modal.size || 'lg'}
      openState={{ isOpen: modal.isOpen, setIsOpen: modal.setIsOpen }}
    >
      <Modal.Header>
        <Modal.Title>{infos.title ?? ''}</Modal.Title>
        {!!infos.subtitle && <Modal.Subtitle>{infos.subtitle}</Modal.Subtitle>}
      </Modal.Header>
      <Modal.Body>
        <div ref={snapshotRef} className="flex flex-col gap-6">
          {!!infos.fileName && (
            <DownloadCanvasButton
              data-html2canvas-ignore
              containerRef={snapshotRef}
              fileName={infos.fileName}
              fileType="png"
              className="m-auto"
              onClick={() => onDownload?.()}
            >
              {appLabels.telecharger}
            </DownloadCanvasButton>
          )}
          {donut && (
            <DonutChart
              {...donut.chart}
              legend={{
                ...donut.chart.legend,
                ...legendBase,
              }}
              className="h-80"
              {...donut.modalChart}
            />
          )}
          {infos.additionalInfos && (
            <div className="mt-4">{infos.additionalInfos}</div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ChartModal;
