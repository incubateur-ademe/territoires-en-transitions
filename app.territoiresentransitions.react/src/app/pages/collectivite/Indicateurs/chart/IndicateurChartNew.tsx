import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ReactECharts } from '../../Trajectoire/graphes/ReactECharts';
import { makeLineSeries, makeOption } from '../../Trajectoire/graphes/utils';
import { TIndicateurValeur } from '../useIndicateurValeurs';

/** Data issues de l'api pour générer les données formatées pour Nivo */
export type IndicateurChartData = {
  /** Unité affichée pour l'axe des abscisses et le tooltip */
  unite?: string;
  /** Valeurs d'un indicateur issues de l'API  */
  valeurs: TIndicateurValeur[];
};

/** Props du graphique générique Indicateur */
export type IndicateurChartProps = {
  /** Data issues de l'api pour générer les données formatées pour Nivo */
  data: IndicateurChartData;
  /** Booléen de chargement des données et infos du graphique */
  isLoading: boolean;
  /** ClassName du container */
  className?: string;
  disableToolbox?: boolean;
  disabledUnite?: boolean;
  title?: string;
  height?: number;
};

const IndicateurChartNew = ({
  data,
  isLoading,
  className,
  disableToolbox,
  disabledUnite,
  title,
  height,
}: IndicateurChartProps) => {
  const noData = data.valeurs.length === 0;

  if (noData) return null;

  const dataset = [
    {
      color: '#6A6AF4',
      id: 'resultats',
      name: 'Mes résultats',
      source: data.valeurs
        .filter((v) => v.type === 'resultat')
        .map((va) => ({
          x: `${va.annee}-01-01`,
          y: va.valeur,
        })),
    },
    {
      color: '#F5895B',
      id: 'objectifs',
      name: 'Mes objectifs',
      source: data.valeurs
        .filter((v) => v.type === 'objectif')
        .map((va) => ({
          x: `${va.annee}-01-01`,
          y: va.valeur,
        })),
    },
  ];

  const option = makeOption({
    option: {
      dataset,
      series: makeLineSeries(dataset),
    },
    titre: title,
    unite: !disabledUnite ? data.unite : undefined,
    disableToolbox,
  });

  return (
    <div className={className} style={{ height: height ?? 320 }}>
      {isLoading ? (
        <div className="h-full w-full rounded-lg flex justify-center items-center bg-primary-0">
          <SpinnerLoader className="w-8 h-8 fill-primary-5" />
        </div>
      ) : (
        <ReactECharts option={option} style={{ height: height ?? 320 }} />
      )}
    </div>
  );
};

export default IndicateurChartNew;
