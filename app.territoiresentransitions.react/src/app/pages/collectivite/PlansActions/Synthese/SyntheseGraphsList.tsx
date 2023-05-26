import {defaultColors, nivoColorsSet, statusColor} from 'ui/charts/chartsTheme';
import {usePlanActionTableauDeBord} from './data/usePlanActionTableauDeBord';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import ChartCard from 'ui/charts/ChartCard';

const getCustomLegend = (data: {id: string; value: number; color?: any}[]) => {
  const legend = data.slice(0, 9).map((d, index) => ({
    name: d.id,
    color: d.color
      ? d.color
      : data.length <= defaultColors.length
      ? defaultColors[index % defaultColors.length]
      : nivoColorsSet[index % nivoColorsSet.length],
  }));

  const lastElement = data[data.length - 1];
  if (
    [
      'Sans statut',
      'Sans pilote',
      'Sans élu·e référent·e',
      'Non priorisé',
    ].includes(lastElement.id) &&
    data.length > 9
  ) {
    legend.push({
      name: lastElement.id,
      color: lastElement.color
        ? lastElement.color
        : data.length <= defaultColors.length
        ? defaultColors[(data.length - 1) % defaultColors.length]
        : nivoColorsSet[(data.length - 1) % nivoColorsSet.length],
    });
  }

  return legend;
};

type SyntheseGraphsListProps = {
  collectiviteId: number;
  planId: number | null;
  withoutPlan: boolean | null;
};

/**
 * Liste des graphes affichés dans la page Synthèse
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 * @param planId - (number | null) id du plan d'action affiché
 * @param withoutPlan - (boolean | null) affichage des données sans plan d'action
 */

const SyntheseGraphsList = ({
  collectiviteId,
  planId,
  withoutPlan,
}: SyntheseGraphsListProps): JSX.Element => {
  const data = usePlanActionTableauDeBord(collectiviteId, planId, withoutPlan);

  const graphsData: {
    id: string;
    title: string;
    data: {id: string; value: number; color?: any}[];
  }[] = data
    ? [
        {
          id: 'statut-avancement',
          title: "Répartition par statut d'avancement",
          data: data.statuts
            ? data.statuts.map(st => ({
                ...st,
                id: st.id !== 'NC' ? st.id : 'Sans statut',
                color: statusColor[st.id],
              }))
            : [],
        },
        {
          id: 'personne-pilote',
          title: 'Répartition par personne pilote',
          data: data.pilotes
            ? data.pilotes.map(pi => ({
                ...pi,
                id: pi.id !== 'NC' ? pi.id : 'Sans pilote',
              }))
            : [],
        },
        {
          id: 'elu-referent',
          title: 'Répartition par élu·e référent·e',
          data: data.referents
            ? data.referents.map(ref => ({
                ...ref,
                id: ref.id !== 'NC' ? ref.id : 'Sans élu·e référent·e',
              }))
            : [],
        },
        {
          id: 'niveau-priorite',
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
              <ChartCard
                chartType="donut"
                chartProps={{
                  data: graph.data,
                  label:
                    graph.id === 'statut-avancement' ||
                    graph.id === 'niveau-priorite',
                }}
                chartInfo={{
                  title: graph.title,
                  legend: getCustomLegend(graph.data),
                  expandable: true,
                  downloadedFileName: `repartition-${graph.id}`,
                }}
                customStyle={{height: '350px', borderBottomWidth: '4px'}}
              />
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
