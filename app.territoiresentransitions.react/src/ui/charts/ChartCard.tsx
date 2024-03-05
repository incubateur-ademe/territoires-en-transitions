import classNames from 'classnames';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {useRef, useState} from 'react';
import DownloadCanvasButton from 'ui/buttons/DownloadCanvasButton';
import Modal from 'ui/shared/floating-ui/Modal';
import BarChart, {BarChartProps} from './BarChart';
import DonutChart, {DonutChartProps} from './DonutChart';
import LineChart, {LineChartProps} from './LineChart';

export const Legend = ({
  legend,
}: {
  legend: {name: string; color: string}[];
}): JSX.Element => {
  return (
    <div className="flex flex-row flex-wrap items-center justify-center gap-x-8 gap-y-3 my-6">
      {legend.map(l => (
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
    legend?: {name: string; color: string}[];
    expandable?: boolean;
    downloadedFileName?: string;
    additionalInfo?: string | string[];
    chartClassname?: string;
  };
  topElement?: (id?: string) => JSX.Element;
};

const useDownloadChartButton = (
  fileName: string | undefined,
  className: string | undefined
) => {
  // Référence utilisée pour le téléchargement du graphe
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const tracker = useFonctionTracker();
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
            onClick={() =>
              tracker({fonction: 'graphique', action: 'telechargement'})
            }
          />
        </div>
      ) : null,
  };
};

const ChartCardModalContent = ({
  chart,
  chartInfo,
  topElement,
}: ChartCardModalContentProps) => {
  // Référence utilisée pour le téléchargement du graphe
  const {chartWrapperRef, DownloadChartButton} = useDownloadChartButton(
    chartInfo?.downloadedFileName,
    'absolute -mr-2 right-0 top-3 z-10'
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

// variante pour les graphes indicateurs
export const ChartCardContent = ({
  chart,
  chartInfo,
  topElement,
}: ChartCardModalContentProps) => {
  // Référence utilisée pour le téléchargement du graphe
  const {chartWrapperRef, downloadable, DownloadChartButton} =
    useDownloadChartButton(
      chartInfo?.downloadedFileName,
      'absolute right-0 top-0 z-10'
    );

  return (
    <div className="relative">
      {/* Bouton de téléchargement, affiché si un nom de fichier est fourni */}
      <DownloadChartButton />

      <div ref={chartWrapperRef} className="p-3">
        {/* Titre du graphe */}
        {!!chartInfo?.title && (
          <p className={classNames('font-bold', {'mr-12': downloadable})}>
            {chartInfo.title}
          </p>
        )}

        {/* Element additionnel optionnel, ajouté entre le titre et le graphe */}
        <div data-html2canvas-ignore>
          {!!topElement && topElement('detailled')}
        </div>

        {/* Graphe agrandi */}
        <div className={classNames('w-full h-50', chartInfo?.chartClassname)}>
          {chart}
        </div>
      </div>
    </div>
  );
};

type ChartCardProps = {
  chartType: 'bar' | 'donut' | 'line';
  chartProps: BarChartProps | DonutChartProps | LineChartProps;
  chartInfo?: {
    title?: string;
    subtitle?: string;
    legend?: {name: string; color: string}[];
    legendOnOverview?: boolean;
    expandable?: boolean;
    downloadedFileName?: string;
    additionalInfo?: string | string[];
  };
  topElement?: (id?: string) => JSX.Element;
  customStyle?: React.CSSProperties;
  className?: string;
};

/**
 * Carte affichant un graphe custom
 *
 * @param chartType 'bar' | 'donut' | 'line'
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
}: ChartCardProps) => {
  const tracker = useFonctionTracker();

  // Etat d'ouverture de la modale "zoom", disponible si chartInfo.expandable === true
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialisation du graphe en fonction des props
  let chart: JSX.Element = <></>;
  switch (chartType) {
    case 'bar':
      chart = <BarChart {...(chartProps as BarChartProps)} />;
      break;
    case 'donut':
      chart = <DonutChart {...(chartProps as DonutChartProps)} />;
      break;
    case 'line':
      chart = <LineChart {...(chartProps as LineChartProps)} />;
      break;
    default:
      break;
  }

  return (
    <div
      className={classNames(
        'border border-gray-200 bg-white flex flex-col w-full h-96 relative',
        {'pt-6': chartInfo?.title || chartInfo?.expandable},
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
            externalOpen={isModalOpen}
            setExternalOpen={setIsModalOpen}
            render={() => (
              <ChartCardModalContent
                chart={chart}
                chartInfo={chartInfo}
                topElement={topElement}
              />
            )}
          >
            <button
              className="fr-btn fr-btn--sm fr-btn--secondary fr-icon-zoom-in-line ml-auto"
              onClick={() => {
                setIsModalOpen(true);
                tracker({fonction: 'graphique', action: 'agrandissement'});
              }}
            />
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
