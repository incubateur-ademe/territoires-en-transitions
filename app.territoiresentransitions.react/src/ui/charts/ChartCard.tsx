import classNames from 'classnames';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {useRef, useState} from 'react';
import DownloadButton from 'ui/buttons/DownloadButton';
import Modal from 'ui/shared/floating-ui/Modal';
import BarChart, {BarChartProps} from './BarChart';
import DonutChart, {DonutChartProps} from './DonutChart';

const Legend = ({
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
              backgroundColor: `${l.color}`,
            }}
          ></div>
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
    extendedTitle?: string;
    legend?: {name: string; color: string}[];
    expandable?: boolean;
    downloadedFileName?: string;
    additionalInfo?: string | string[];
  };
  topElement?: (id?: string) => JSX.Element;
};

const ChartCardModalContent = ({
  chart,
  chartInfo,
  topElement,
}: ChartCardModalContentProps) => {
  const tracker = useFonctionTracker();

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
        {chartInfo?.extendedTitle ? (
          <h4
            className={classNames({
              'pb-2': chartInfo.subtitle !== undefined,
              'pb-4': chartInfo.subtitle === undefined,
            })}
          >
            {chartInfo?.extendedTitle}
          </h4>
        ) : (
          chartInfo?.title && (
            <h4
              className={classNames('m-0 font-bold', {
                'pb-2': chartInfo.subtitle !== undefined,
                'pb-4': chartInfo.subtitle === undefined,
              })}
            >
              {chartInfo.title}
            </h4>
          )
        )}

        {/* Sous-titre du graphe */}
        {chartInfo?.subtitle && (
          <h4 className="pb-4 m-0 font-medium text-[#666]">
            {chartInfo.subtitle}
          </h4>
        )}

        {/* Element additionnel optionnel, ajouté entre le titre et le graphe */}
        <div data-html2canvas-ignore className="pb-2">
          {!!topElement && topElement('detailled')}
        </div>

        {/* Graphe agrandi */}
        <div className="w-full h-96">{chart}</div>

        {/* Légende */}
        {chartInfo?.legend && <Legend legend={chartInfo.legend} />}

        {/* Info additionelles */}
        {chartInfo?.additionalInfo && (
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
  chartType: 'bar' | 'donut';
  chartProps: BarChartProps | DonutChartProps;
  chartInfo?: {
    title?: string;
    subtitle?: string;
    extendedTitle?: string;
    legend?: {name: string; color: string}[];
    legendOnOverview?: boolean;
    expandable?: boolean;
    downloadedFileName?: string;
    additionalInfo?: string | string[];
  };
  topElement?: (id?: string) => JSX.Element;
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
        <div>
          {/* Titre du graphe */}
          {chartInfo?.title && (
            <div
              className={classNames('font-bold', {
                'pb-1': chartInfo.subtitle !== undefined,
                'pb-3': chartInfo.subtitle === undefined,
              })}
            >
              {chartInfo.title}
            </div>
          )}
          {/* Sous-titre du graphe */}
          {chartInfo?.subtitle && (
            <div className="pb-3 font-medium text-[#666]">
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
              onClick={() => setIsModalOpen(true)}
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
