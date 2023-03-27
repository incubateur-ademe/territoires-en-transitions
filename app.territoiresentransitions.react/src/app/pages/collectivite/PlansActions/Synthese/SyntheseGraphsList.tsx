import {StatusColor} from 'ui/charts/chartsTheme';
import ChartWrapper from 'ui/charts/ChartWrapper';
import DoughnutChart from 'ui/charts/DoughnutChart';
import {usePlanActionTableauDeBord} from './data/usePlanActionTableauDeBord';

/**
 * Liste des graphes affichés dans la page Synthèse
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 * @param planId - (number | null) id du plan d'action affiché
 * @param withoutPlan - (boolean | null) affichage des données sans plan d'action
 */

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
            ...st,
            // @ts-ignore
            color: StatusColor[st.label] ?? '#ccc',
          })),
        },
        {
          title: 'Répartition par personne pilote',
          data: data.pilotes,
        },
        {
          title: 'Répartition par élu.e référent.e',
          data: data.referents,
        },
        {
          title: 'Répartition par échéance',
          data: data.priorites,
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
          <ChartWrapper title={graph.title} customClass="border-b-4">
            <DoughnutChart data={graph.data} />
          </ChartWrapper>
        </div>
      ))}
    </div>
  );
};

export default SyntheseGraphsList;
