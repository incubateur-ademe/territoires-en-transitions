import {
  LAYERS,
  ReactECharts,
  makeLineSeries,
  makeOption,
} from '@/app/ui/charts/echarts';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { GridComponentOption } from 'echarts';
import { TIndicateurValeur } from '../useIndicateurValeurs';

type ChartVariant = 'thumbnail' | 'modal' | 'detail';

const variantToHeight: Record<ChartVariant, number> = {
  thumbnail: 320,
  modal: 550,
  detail: 450,
};

const variantToGrid: Record<ChartVariant, GridComponentOption> = {
  thumbnail: { top: '8%', bottom: '15%', right: '5%' },
  modal: {},
  detail: { left: 32, right: 32 },
};

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
  /** Variant du graphe, en fonction du cas d'utilisation */
  variant?: ChartVariant;
  /** ClassName du container */
  className?: string;
};

const IndicateurChart = ({
  data,
  title,
  isLoading,
  variant = 'detail',
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

  const style = { height: variantToHeight[variant] };

  const grid = variantToGrid[variant];

  const option = makeOption({
    option: {
      dataset,
      series: makeLineSeries(dataset),
      grid,
      title: variant === 'detail' ? { left: 28 } : {},
    },
    titre: title,
    unite: variant !== 'thumbnail' ? data.unite : undefined,
    disableToolbox: variant !== 'modal',
    hideMinMaxLabel:
      dataset[0].source.length <= 1 && dataset[1].source.length <= 1,
  });

  return (
    <div className={className} style={style}>
      {isLoading ? (
        <div className="h-full w-full rounded-lg flex justify-center items-center bg-primary-0">
          <SpinnerLoader className="w-8 h-8 fill-primary-5" />
        </div>
      ) : (
        <ReactECharts option={option} style={style} />
      )}
    </div>
  );
};

export default IndicateurChart;
