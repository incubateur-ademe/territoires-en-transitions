import { ModalSize } from '@/ui';

import ChartModal from './ChartModal';
import DonutChart, { DonutChartProps } from './Donut/DonutChart';

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
  /** Les informations détaillées à afficher dans la modale de téléchargement */
  infos?: ChartInfosProps;
  // appelée lors du clic sur le bouton "Télécharger"
  onDownload?: () => void;
};

/**
 * Composant générique à utiliser pour les graphiques de l'app.
 * Il permet d'afficher le graphique et de le télécharger.
 */
const Chart = (props: ChartProps) => {
  const { infos, donut } = props;

  return (
    <>
      {donut && <DonutChart {...donut.chart} />}
      {infos?.modal?.isOpen && <ChartModal {...props} />}
    </>
  );
};

export default Chart;
