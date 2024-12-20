import {
  LAYERS,
  ReactECharts,
  makeLineSeries,
  makeOption,
} from '@/app/ui/charts/echarts';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { TIndicateurValeur } from '../useIndicateurValeurs';

/** Data issues de l'api pour générer les données formatées pour echarts */
/** TODO: le format devra être revu après la refonte indicateurs et la maj du fetch */
export type IndicateurChartData = {
  /** Unité affichée pour l'axe des abscisses et le tooltip */
  unite?: string;
  /** Valeurs de l'indicateur  */
  valeurs: {
    objectifs: TIndicateurValeur[];
    resultats: TIndicateurValeur[];
  };
};

/** Props du graphique générique Indicateur */
export type IndicateurChartProps = {
  /** Data issues de l'api pour générer les données formatées pour Nivo */
  data: IndicateurChartData;
  /** Titre du graphe */
  title?: string;
  /** Booléen de chargement des données et infos du graphique */
  isLoading: boolean;
  /** Taille du graphe */
  size?: 'sm' | 'lg';
  /** ClassName du container */
  className?: string;
};

const IndicateurChartNew = ({
  data,
  title,
  isLoading,
  size = 'lg',
  className,
}: IndicateurChartProps) => {
  const { objectifs, resultats } = data.valeurs;

  const noData = objectifs.length === 0 && resultats.length === 0;

  if (noData) return null;

  const dataset = [
    {
      color: LAYERS.resultats.color,
      id: 'resultats',
      name: LAYERS.resultats.label,
      source: resultats.map((res) => ({
        x: new Date(res.annee, 0, 1).toISOString(),
        y: res.valeur,
      })),
    },
    {
      color: LAYERS.objectifs.color,
      id: 'objectifs',
      name: LAYERS.objectifs.label,
      source: objectifs.map((obj) => ({
        x: new Date(obj.annee, 0, 1).toISOString(),
        y: obj.valeur,
      })),
    },
  ];

  const option = makeOption({
    option: {
      dataset,
      series: makeLineSeries(dataset),
      grid: size === 'sm' ? { top: '8%', bottom: '15%', right: '5%' } : {},
    },
    titre: title,
    unite: size !== 'sm' ? data.unite : undefined,
    disableToolbox: size === 'sm',
  });

  return (
    <div className={className} style={{ height: size === 'sm' ? 320 : 500 }}>
      {isLoading ? (
        <div className="h-full w-full rounded-lg flex justify-center items-center bg-primary-0">
          <SpinnerLoader className="w-8 h-8 fill-primary-5" />
        </div>
      ) : (
        <ReactECharts
          option={option}
          style={{ height: size === 'sm' ? 320 : 500 }}
        />
      )}
    </div>
  );
};

export default IndicateurChartNew;
