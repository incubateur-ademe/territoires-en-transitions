import {useState} from 'react';

import {TSyntheseVue, getGraphData} from '../utils';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {usePlanActionTableauDeBord} from '../data/usePlanActionTableauDeBord';
import {PlanActionFilter} from '../FiltersPlanAction';
import Chart, {ChartProps} from 'ui/charts/Chart';
import {Button} from '@tet/ui';

type Props = {
  vue: TSyntheseVue;
  plan: PlanActionFilter;
};

const SyntheseVueGraph = ({vue, plan}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data} = usePlanActionTableauDeBord(
    collectivite_id!,
    plan.id === 'tous' || plan.id === 'nc' ? null : plan.id,
    plan.id === 'nc' || null
  );

  const [isChartOpen, setIsChartOpen] = useState(false);

  const chart: ChartProps | null = data && {
    donut: {
      chart: {
        data: getGraphData(vue.id, data),
        className: 'h-80',
        legend: {
          isOpen: true,
          size: 'md',
          maxItems: 9,
        },
      },
    },
    infos: {
      modal: {
        isOpen: isChartOpen,
        setIsOpen: setIsChartOpen,
      },
      title: vue.graphTitre,
      subtitle:
        plan.id === 'nc'
          ? 'Fiches non classées'
          : plan.id === 'tous'
          ? 'Toutes les fiches'
          : plan.name,
      fileName: `repartition-${vue.id}${
        plan.id === 'nc'
          ? '-fiches-non-classees'
          : plan.id !== 'tous'
          ? `-${plan.name.toLowerCase().split(' ').join('-')}`
          : undefined
      }`,
    },
  };

  if (!chart) return null;

  return (
    <div className="relative">
      {/* Bouton de téléchargement, affiché si un nom de fichier est fourni */}
      <div className="absolute right-4 top-4 z-10">
        <Button
          icon="zoom-in-line"
          size="xs"
          variant="outlined"
          onClick={() => setIsChartOpen(true)}
        />
      </div>

      <div className="p-6">
        {/* Titre du graphe */}
        <p className="mb-1 mr-12 font-bold">{chart.infos?.title}</p>

        {/** Sous-titre du plan */}
        <div className="text-gray-500">{chart.infos?.subtitle}</div>

        {/* Chart */}
        <Chart {...chart} />
      </div>
    </div>
  );
};

export default SyntheseVueGraph;
