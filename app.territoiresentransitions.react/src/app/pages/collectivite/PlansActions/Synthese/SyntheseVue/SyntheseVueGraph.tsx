import {Legend} from 'ui/charts/ChartCard';
import {Graph, TSyntheseVue, getCustomLegend, getGraphData} from '../utils';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {usePlanActionTableauDeBord} from '../data/usePlanActionTableauDeBord';
import {PlanActionFilter} from '../FiltersPlanAction';
import DonutChart, {DonutChartProps} from 'ui/charts/DonutChart';
import DownloadCanvasButton from 'ui/buttons/DownloadCanvasButton';
import {useRef} from 'react';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';

type Props = {
  vue: TSyntheseVue;
  plan: PlanActionFilter;
};

const SyntheseVueGraph = ({vue, plan}: Props) => {
  const collectivite_id = useCollectiviteId();

  const tracker = useFonctionTracker();

  const {data} = usePlanActionTableauDeBord(
    collectivite_id!,
    plan.id === 'tous' || plan.id === 'nc' ? null : plan.id,
    plan.id === 'nc' || null
  );

  // Référence utilisée pour le téléchargement du graphe
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const graph: Graph | null = data && {
    id: vue.id,
    title: vue.graphTitre,
    data: getGraphData(vue.id, data),
  };

  if (!graph) return null;

  return (
    <div className="relative">
      {/* Bouton de téléchargement, affiché si un nom de fichier est fourni */}
      <div className="absolute right-4 top-4 z-10">
        <DownloadCanvasButton
          containerRef={chartWrapperRef}
          fileName={`repartition-${graph.id}${
            plan.id === 'nc'
              ? '-fiches-non-classees'
              : plan.id !== 'tous'
              ? `-${plan.name.toLowerCase().split(' ').join('-')}`
              : ''
          }`}
          fileType="png"
          onClick={() =>
            tracker({fonction: 'graphique', action: 'telechargement'})
          }
        />
      </div>

      <div ref={chartWrapperRef} className="p-6">
        {/* Titre du graphe */}
        <p className="mb-1 mr-12 font-bold">{graph.title}</p>

        {/** Titre du plan */}
        <div className="text-gray-500">
          {plan.id === 'nc'
            ? 'Fiches non classées'
            : plan.id === 'tous'
            ? 'Toutes les fiches'
            : plan.name}
        </div>

        {/* Graphe agrandi */}
        <div className="w-full h-80">
          <DonutChart
            {...({
              data: graph.data,
              label: true,
            } as DonutChartProps)}
          />
        </div>

        {/* Légende */}
        {getCustomLegend(graph.data) && (
          <div className="-mt-8 -mb-6">
            <Legend legend={getCustomLegend(graph.data)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SyntheseVueGraph;
