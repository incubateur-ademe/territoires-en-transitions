import {ModalSize} from '@tet/ui';

import DonutChart, {DonutChartProps} from './Donut/DonutChart';
import LineChart, {LineChartProps} from './Line/LineChart';
import ChartModal from './ChartModal';

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
