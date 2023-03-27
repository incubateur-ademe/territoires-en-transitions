import {StatusColor} from 'ui/charts/chartsTheme';
import ChartWrapper from 'ui/charts/ChartWrapper';
import DoughnutChart from 'ui/charts/DoughnutChart';
import {usePlanActionTableauDeBord} from './data/usePlanActionTableauDeBord';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';

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
          id: 'statuts',
          title: "Répartition par statut d'avancement",
          data: data.statuts
            ? data.statuts.map(st => ({
                ...st,
                id: st.id !== 'NC' ? st.id : 'Sans statut',
                // @ts-ignore
                color: StatusColor[st.id],
              }))
            : [],
        },
        {
          id: 'pilotes',
          title: 'Répartition par personne pilote',
          data: data.pilotes
            ? data.pilotes.map(pi => ({
                ...pi,
                id: pi.id !== 'NC' ? pi.id : 'Sans pilote',
              }))
            : [],
        },
        {
          id: 'referents',
          title: 'Répartition par élu·e référent·e',
          data: data.referents
            ? data.referents.map(ref => ({
                ...ref,
                id: ref.id !== 'NC' ? ref.id : 'Sans élu·e référent·e',
              }))
            : [],
        },
        {
          id: 'priorites',
          title: 'Répartition par niveau de priorité',
          data: data.priorites
            ? data.priorites.map(pr => ({
                ...pr,
                id: pr.id !== 'NC' ? pr.id : 'Non priorisé',
              }))
            : [],
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

  return data ? (
    <div className="fr-grid-row fr-grid-row--gutters">
      {graphsData.map(
        graph =>
          !!graph.data.length && (
            <div key={graph.title} className="fr-col-sm-12 fr-col-xl-6">
              <ChartWrapper
                title={graph.title}
                customClass="border-b-4"
                customStyle={{height: '350px'}}
              >
                <DoughnutChart
                  data={graph.data}
                  label={graph.id === 'statuts' || graph.id === 'priorites'}
                />
              </ChartWrapper>
            </div>
          )
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center mt-8">
      <PictoLeaf className="w-24 fill-gray-400" />
      <div className="my-6 text-gray-500">Aucune fiche n'est renseignée</div>
    </div>
  );
};

export default SyntheseGraphsList;
