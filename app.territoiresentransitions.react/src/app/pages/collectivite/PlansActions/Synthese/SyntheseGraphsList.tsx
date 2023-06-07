import {defaultColors, nivoColorsSet, statusColor} from 'ui/charts/chartsTheme';
import {usePlanActionTableauDeBord} from './data/usePlanActionTableauDeBord';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import ChartCard from 'ui/charts/ChartCard';
import {Link} from 'react-router-dom';
import {makeCollectivitePlansActionsNouveauUrl} from 'app/paths';

const getLegendColor = (
  data: {id: string; value: number; color?: any},
  dataLength: number,
  index: number
) => {
  if (data.color) {
    return data.color;
  }
  if (dataLength <= defaultColors.length) {
    return defaultColors[index % defaultColors.length];
  }
  return nivoColorsSet[index % nivoColorsSet.length];
};

const getCustomLegend = (data: {id: string; value: number; color?: any}[]) => {
  // Limitation du nombre d'éléments visibles dans la légende
  const legendMaxSize = 9;

  // Légendes associées au données sans label
  const withoutLabelLegends = [
    'Sans statut',
    'Sans pilote',
    'Sans élu·e référent·e',
    'Non priorisé',
  ];

  // Légende réduite à afficher
  const legend = data.slice(0, legendMaxSize).map((d, index) => ({
    name: d.id,
    color: getLegendColor(d, data.length, index),
  }));

  const lastElement = data[data.length - 1];

  if (
    withoutLabelLegends.includes(lastElement.id) &&
    data.length > legendMaxSize
  ) {
    legend.push({
      name: lastElement.id,
      color: getLegendColor(lastElement, data.length, data.length - 1),
    });
  }

  return legend;
};

type SyntheseGraphsListProps = {
  collectiviteId: number;
  selectedPlan: {id: number | null; name: string};
  withoutPlan: boolean | null;
  isReadonly: boolean;
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
  selectedPlan,
  withoutPlan,
  isReadonly,
}: SyntheseGraphsListProps): JSX.Element => {
  const data = usePlanActionTableauDeBord(
    collectiviteId,
    selectedPlan.id,
    withoutPlan
  );

  const graphsData: {
    id: string;
    title: string;
    data: {id: string; value: number; color?: any}[];
  }[] = data
    ? [
        {
          id: 'statut-avancement',
          title: "Répartition par statut d'avancement",
          data: data.statuts.map(st => ({
            ...st,
            id: st.id !== 'NC' ? st.id : 'Sans statut',
            color: statusColor[st.id],
          })),
        },
        {
          id: 'personne-pilote',
          title: 'Répartition par personne pilote',
          data: data.pilotes.map(pi => ({
            ...pi,
            id: pi.id !== 'NC' ? pi.id : 'Sans pilote',
          })),
        },
        {
          id: 'elu-referent',
          title: 'Répartition par élu·e référent·e',
          data: data.referents.map(ref => ({
            ...ref,
            id: ref.id !== 'NC' ? ref.id : 'Sans élu·e référent·e',
          })),
        },
        {
          id: 'niveau-priorite',
          title: 'Répartition par niveau de priorité',
          data: data.priorites.map(pr => ({
            ...pr,
            id: pr.id !== 'NC' ? pr.id : 'Non priorisé',
          })),
        },
        {
          id: 'echeance',
          title: 'Répartition par échéance',
          data: data.echeances,
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
                  extendedTitle: `${selectedPlan.name} - ${graph.title}`,
                  legend: getCustomLegend(graph.data),
                  expandable: true,
                  downloadedFileName: `repartition-${
                    graph.id
                  }-${selectedPlan.name.toLowerCase().split(' ').join('-')}`,
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
      <div className="my-6 text-gray-500">
        Aucune fiche action pour l’instant
      </div>
      {!isReadonly && (
        <div className="flex justify-center mt-6">
          <Link
            className="fr-btn"
            to={makeCollectivitePlansActionsNouveauUrl({
              collectiviteId,
            })}
          >
            Créer ou importer un plan d'action
          </Link>
        </div>
      )}
    </div>
  );
};

export default SyntheseGraphsList;
