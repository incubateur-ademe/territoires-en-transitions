import {Modal, ModalSize} from '@tet/ui';

import DonutChart, {DonutChartProps} from './Donut/DonutChart';
import LineChart, {LineChartProps} from './Line/LineChart';
import DownloadCanvasButton from 'ui/buttons/DownloadCanvasButton';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';

/** Informations détaillées du graphique visible sur la modale de téléchargement */
export type ChartInfosProps = {
  /** État d'ouverture de la modale et configuration */
  modal?: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    /** Taille de la modale */
    size?: ModalSize;
  };
  /** Titre du graphique */
  title?: string;
  /** Sous-titre du graphique */
  subtitle?: string;
  /** Informations additionnelles affichées sous le graphique et sa légende.
   * Peut être utilisé pour des légendes complexes ou un simple texte complémentaire */
  additionalInfos?: React.ReactElement | string;
  /** Doit être donné pour afficher le bouton de téléchargement */
  fileName?: string;
};

export type ChartProps = {
  /** Graphique donut */
  donut?: {
    /** Propriétés du graphique donut */
    chart: DonutChartProps;
    /** Propriétés du graphique donut de la modale, permet d'ajouter des configurations additionnelles.
     * Si non défini, le graphique de la modale sera identique à celui de base. */
    modalChart?: Omit<DonutChartProps, 'data'>;
  };
  /** Graphique droites */
  line?: {
    /** Propriétés du graphique droites */
    chart: LineChartProps;
    /** Propriétés du graphique droite de la modale, permet d'ajouter des configurations additionnelles.
     * Si non défini, le graphique de la modale sera identique à celui de base. */
    modalChart?: Omit<LineChartProps, 'data'>;
  };
  /** Les informations détaillées à afficher dans la modale de téléchargement */
  infos?: ChartInfosProps;
};

/**
 * Composant générique à utiliser pour les graphiques de l'app.
 * Il permet d'afficher le graphique et de le télécharger.
 */
const Chart = (props: ChartProps) => {
  const {infos, line, donut} = props;

  if (line && donut) {
    throw new Error(
      'Chart ne peut pas être utilisé avec plusieurs graphiques.'
    );
  }

  return (
    <>
      {line && <LineChart {...line.chart} />}
      {donut && <DonutChart {...donut.chart} />}
      {infos?.modal?.isOpen && <ChartModal {...props} />}
    </>
  );
};

export default Chart;

/** Modale qui présente le graphique complet et permet de le télécharger */
const ChartModal = (props: ChartProps) => {
  const {infos, line, donut} = props;

  const tracker = useFonctionTracker();

  // Si la modale est ouverte alors elle est forcément définie
  const modal = infos?.modal!;

  // On affiche toujours la légende par défaut dans la modale
  const legendBase = {
    isOpen: true,
    className: 'mt-6',
  };

  if (!infos) return null;

  return (
    <Modal
      size={modal.size || 'lg'}
      openState={{isOpen: modal.isOpen, setIsOpen: modal.setIsOpen}}
      render={({ref}) => (
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
              onClick={() =>
                tracker({fonction: 'graphique', action: 'telechargement'})
              }
            >
              Télécharger
            </DownloadCanvasButton>
          )}
          {line && (
            <LineChart
              {...line.chart}
              legend={{
                ...line.chart.legend,
                ...legendBase,
              }}
              {...line.modalChart}
            />
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
