import { Modal } from '@tet/ui';

import DownloadCanvasButton from '@/app/ui/buttons/DownloadCanvasButton';
import { ChartProps } from './Chart';
import DonutChart from './Donut/DonutChart';

/** Modale qui présente le graphique complet et permet de le télécharger */
const ChartModal = (props: ChartProps) => {
  const { infos, donut, onDownload } = props;

  // Si la modale est ouverte alors elle est forcément définie
  const modal = infos?.modal;

  // On affiche toujours la légende par défaut dans la modale
  const legendBase = {
    isOpen: true,
    className: 'mt-6',
  };

  if (!infos || !modal) return null;

  return (
    <Modal
      size={modal.size || 'lg'}
      openState={{ isOpen: modal.isOpen, setIsOpen: modal.setIsOpen }}
      render={({ ref }) => (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            {!!infos.title && (
              <h4 className="text-primary-8 mb-2">{infos.title}</h4>
            )}
            {!!infos.subtitle && (
              <div className="text-lg font-medium text-grey-8">
                {infos.subtitle}
              </div>
            )}
          </div>
          {!!infos.fileName && (
            <DownloadCanvasButton
              data-html2canvas-ignore
              containerRef={ref}
              fileName={infos.fileName}
              fileType="png"
              className="m-auto"
              onClick={() => onDownload?.()}
            >
              Télécharger
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
      )}
    />
  );
};

export default ChartModal;
