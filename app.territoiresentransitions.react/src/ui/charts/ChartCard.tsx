import {useTracker} from 'core-logic/hooks/useTracker';
import {useRef, useState} from 'react';
import DownloadButton from 'ui/DownloadButton';
import Modal from 'ui/shared/floating-ui/Modal';
import BarChart, {BarChartProps} from './BarChart';
import DonutChart, {DonutChartProps} from './DonutChart';

type ChartCardModalContentProps = {
  chart: JSX.Element;
  chartInfo?: {
    title?: string;
    legend?: {name: string; color: string}[];
    expandable?: boolean;
    downloadedFileName?: string;
    additionalInfo?: string | string[];
  };
  topElement?: JSX.Element;
};

const ChartCardModalContent = ({
  chart,
  chartInfo,
  topElement,
}: ChartCardModalContentProps) => {
  const tracker = useTracker();

  // Référence utilisée pour le téléchargement du graphe
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      {/* Bouton de téléchargement, affiché si un nom de fichier est fourni */}
      {chartInfo?.downloadedFileName && (
        <div className="absolute -mr-2 right-0 top-3 z-10">
          <DownloadButton
            containerRef={chartWrapperRef}
            fileName={chartInfo.downloadedFileName}
            fileType="png"
            onClick={() =>
              tracker({fonction: 'graphique', action: 'telechargement'})
            }
          />
        </div>
      )}

      <div ref={chartWrapperRef} className="p-3">
        {/* Titre du graphe */}
        {chartInfo?.title && <h4>{chartInfo.title}</h4>}

        {/* Element additionnel optionnel, ajouté entre le titre et le graphe */}
        <div data-html2canvas-ignore>{topElement}</div>

        {/* Graphe agrandi */}
        <div className="w-full h-96">{chart}</div>

        {/* Légende */}
        {chartInfo?.legend && (
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-6">
            {chartInfo.legend.map(l => (
              <div key={l.name} className="flex flex-row items-center gap-3">
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: `${l.color}`,
                  }}
                ></div>
                <div className="shifted-text">{l.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Info additionelles */}
        {chartInfo?.additionalInfo && (
          <div className="flex flex-col mt-12 text-slate-500">
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
  chartType: 'bar' | 'donut';
  chartProps: BarChartProps | DonutChartProps;
  chartInfo?: {
    title?: string;
    legend?: {name: string; color: string}[];
    expandable?: boolean;
    downloadedFileName?: string;
    additionalInfo?: string | string[];
  };
  topElement?: JSX.Element;
  customStyle?: React.CSSProperties;
};

/**
 * Carte affichant un graphe custom
 *
 * @param chartType 'bar' | 'daughnut'
 * @param chartProps BarChartProps | DoughnutChartProps
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
}: ChartCardProps) => {
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
    default:
      break;
  }

  return (
    <div
      className={`border border-gray-200 bg-white flex flex-col w-full h-96 relative ${
        chartInfo?.title || chartInfo?.expandable ? 'pt-6' : ''
      }`}
      style={customStyle}
    >
      {/* En-tête de la carte */}
      <div className="flex flex-row justify-between px-6">
        {/* Titre du graphe */}
        {chartInfo?.title && <div className="font-bold">{chartInfo.title}</div>}

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
              onClick={() => setIsModalOpen(true)}
            />
          </Modal>
        )}
      </div>

      {/* Element additionnel optionnel, ajouté entre le titre et le graphe */}
      <div className="absolute left-6 top-14 z-10">{topElement}</div>

      {/* Graphe miniature */}
      {chart}
    </div>
  );
};

export default ChartCard;
