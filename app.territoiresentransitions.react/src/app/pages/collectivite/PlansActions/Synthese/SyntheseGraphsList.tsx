import {StatusColor} from 'ui/charts/chartsTheme';
import {usePlanActionTableauDeBord} from './data/usePlanActionTableauDeBord';
import SyntheseCard from './SyntheseCard';

type SyntheseGraphsListProps = {
  collectiviteId: number;
  planId: number | null;
  withoutPlan: boolean | null;
};

const SyntheseGraphsList = ({
  collectiviteId,
  planId,
  withoutPlan,
}: SyntheseGraphsListProps): JSX.Element => {
  const data = usePlanActionTableauDeBord(collectiviteId, planId, withoutPlan);

  const graphsData = data
    ? [
        {
          title: "Répartition par statut d'avancement",
          data: data.statuts.map(st => ({
            value: st.value,
            id: st.label,
            // @ts-ignore
            color: StatusColor[st.label] ?? '#ccc',
          })),
        },
        {
          title: 'Répartition par personne pilote',
          data: data.pilotes.map(pi => ({
            value: pi.value,
            id: pi.label,
          })),
        },
        {
          title: 'Répartition par élu.e référent.e',
          data: data.referents.map(ref => ({
            value: ref.value,
            id: ref.label,
          })),
        },
        {
          title: 'Répartition par échéance',
          data: data.priorites.map(pr => ({
            value: pr.value,
            id: pr.label,
          })),
        },
        // {
        //   title: 'Répartition par direction pilote',
        //   data: [],
        // },
        // {
        //   title: 'Répartition par budget prévisionnel',
        //   data: [],
        // },
      ]
    : [];

  return (
    <div className="fr-grid-row fr-grid-row--gutters">
      {graphsData.map(graph => (
        <div key={graph.title} className="fr-col-sm-12 fr-col-xl-6">
          <SyntheseCard title={graph.title} data={graph.data} />
        </div>
      ))}
    </div>
  );
};

export default SyntheseGraphsList;
