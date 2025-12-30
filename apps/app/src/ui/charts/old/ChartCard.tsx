import DownloadCanvasButton from '@/app/ui/buttons/DownloadCanvasButton';
import { Button, Modal } from '@tet/ui';
import classNames from 'classnames';
import { useRef, useState } from 'react';
import BarChart, { BarChartProps } from './BarChart';

export const Legend = ({
  legend,
}: {
  legend: { name: string; color: string }[];
}): JSX.Element => {
  return (
    <div className="flex flex-row flex-wrap items-center justify-center gap-x-8 gap-y-3 my-6">
      {legend.map((l) => (
        <div key={l.name} className="flex flex-row items-center gap-3">
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: l.color,
            }}
          />
          <div>{l.name}</div>
        </div>
      ))}
    </div>
  );
};

type ChartCardModalContentProps = {
  chart: JSX.Element;
  chartInfo?: {
    title?: string;
    subtitle?: string;
    legend?: { name: string; color: string }[];
    expandable?: boolean;
    downloadedFileName?: string;
    additionalInfo?: string | string[];
    chartClassname?: string;
  };
  topElement?: (id?: string) => JSX.Element;
  // appelée lors du clic sur le bouton "Télécharger"
  onDownload?: () => void;
};

const useDownloadChartButton = (
  fileName: string | undefined,
  className: string | undefined,
  onDownload: (() => void) | undefined
) => {
  // Référence utilisée pour le téléchargement du graphe
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const downloadable = !!fileName;

  return {
    chartWrapperRef,
    downloadable,
    DownloadChartButton: () =>
      downloadable ? (
        <div className={className}>
          <DownloadCanvasButton
            containerRef={chartWrapperRef}
            fileName={fileName}
            fileType="png"
            onClick={() => onDownload?.()}
          >
            Télécharger le graphique
          </DownloadCanvasButton>
        </div>
      ) : null,
  };
};

const ChartCardModalContent = ({
  chart,
  chartInfo,
  topElement,
  onDownload,
}: ChartCardModalContentProps) => {
  // Référence utilisée pour le téléchargement du graphe
  const { chartWrapperRef, DownloadChartButton } = useDownloadChartButton(
    chartInfo?.downloadedFileName,
    'absolute -mr-2 right-0 top-3 z-10',
    onDownload
  );

  return (
    <div className="relative">
      <DownloadChartButton />

      <div ref={chartWrapperRef} className="p-3">
        <div className="pb-4">
          {/* Titre du graphe */}
          {!!chartInfo?.title && <h4 className="m-0">{chartInfo.title}</h4>}

          {/* Sous-titre du graphe */}
          {!!chartInfo?.subtitle && (
            <h4 className="m-0 pt-2 font-medium text-[#666]">
              {chartInfo.subtitle}
            </h4>
          )}
        </div>

        {/* Element additionnel optionnel, ajouté entre le titre et le graphe */}

        {!!topElement && (
          <div data-html2canvas-ignore className="pb-2">
            {topElement('detailled')}
          </div>
        )}

        {/* Graphe agrandi */}
        <div className={classNames('w-full h-96', chartInfo?.chartClassname)}>
          {chart}
        </div>

        {/* Légende */}
        {chartInfo?.legend && <Legend legend={chartInfo.legend} />}

        {/* Info additionelles */}
        {!!chartInfo?.additionalInfo && (
          <div className="flex flex-col mt-12 text-[#666]">
            {Array.isArray(chartInfo.additionalInfo) ? (
              chartInfo.additionalInfo.map((info, index) => (
                <span key={index}>{info}</span>
              ))
            ) : (
              <span>{chartInfo.additionalInfo}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

type ChartCardProps = {
  chartType: 'bar';
  chartProps: BarChartProps;
  chartInfo?: {
    title?: string;
    subtitle?: string;
    legend?: { name: string; color: string }[];
    legendOnOverview?: boolean;
    expandable?: boolean;
    downloadedFileName?: string;
    additionalInfo?: string | string[];
  };
  topElement?: (id?: string) => JSX.Element;
  customStyle?: React.CSSProperties;
  className?: string;
  // appelée lors de l'ouverture de la modale "zoom"
  onOpenModal?: () => void;
  // appelée lors du clic sur le bouton "Télécharger"
  onDownload?: () => void;
};

/**
 * Carte affichant un graphe custom
 *
 * @param chartType 'bar'
 * @param chartProps BarChartProps | DonutChartProps |
 * @param chartInfo title, legend, expandable, downloadFileName, additionalInfo
 * @param topElement JSX.Element (affiché entre le titre et le graphe)
 * @param customStyle React.CSSProperties
 */

const ChartCard = ({
  chartType,
  chartProps,
  chartInfo,
  topElement,
  customStyle,
  className,
  onOpenModal,
  onDownload,
}: ChartCardProps) => {
  // Etat d'ouverture de la modale "zoom", disponible si chartInfo.expandable === true
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialisation du graphe en fonction des props
  let chart: JSX.Element = <></>;
  switch (chartType) {
    case 'bar':
      chart = (
        <BarChart
          {...(chartProps as BarChartProps)}
          isIntoModal={isModalOpen}
        />
      );
      break;
    default:
      break;
  }

  return (
    <div
      className={classNames(
        'border border-gray-200 bg-white flex flex-col w-full h-96 relative',
        { 'pt-6': chartInfo?.title || chartInfo?.expandable },
        className
      )}
      style={customStyle}
    >
      {/* En-tête de la carte */}
      <div className="flex flex-row justify-between px-6">
        <div className="pb-3">
          {/* Titre du graphe */}
          {!!chartInfo?.title && (
            <div className="font-bold">{chartInfo.title}</div>
          )}
          {/* Sous-titre du graphe */}
          {!!chartInfo?.subtitle && (
            <div className="pt-1 font-medium text-[#666]">
              {chartInfo.subtitle}
            </div>
          )}
        </div>

        {/* Bouton + modale permettant un affichage agrandi du graphe */}
        {chartInfo?.expandable && (
          <Modal
            size="xl"
            openState={{
              isOpen: isModalOpen,
              setIsOpen: setIsModalOpen,
            }}
            render={() => (
              <ChartCardModalContent
                chart={chart}
                chartInfo={chartInfo}
                topElement={topElement}
                onDownload={onDownload}
              />
            )}
          >
            <Button
              icon="zoom-in-line"
              size="xs"
              variant="outlined"
              onClick={() => {
                setIsModalOpen(true);
                onOpenModal?.();
              }}
              className="ml-auto h-fit"
            >
              Détails
            </Button>
          </Modal>
        )}
      </div>

      {/* Element additionnel optionnel, ajouté entre le titre et le graphe */}
      <div className="px-6 w-full">
        {!!topElement && topElement('overview')}
      </div>

      {/* Graphe miniature */}
      {chart}

      {/* Légende */}
      {chartInfo?.legend && chartInfo?.legendOnOverview && (
        <Legend legend={chartInfo.legend} />
      )}
    </div>
  );
};

export default ChartCard;
