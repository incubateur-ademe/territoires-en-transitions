import {defaultColors, nivoColorsSet, statusColor} from 'ui/charts/chartsTheme';
import {FiltersKeys} from '../FicheAction/data/filters';
import {TPlanActionTableauDeBord} from './data/usePlanActionTableauDeBord';

const statutsGraphTitre = "Répartition par statut d'avancement";
const pilotesGraphTitre = 'Répartition par personne pilote';
const referentsGraphTitre = 'Répartition par élu·e référent·e';
const prioritesGraphTitre = 'Répartition par niveau de priorité';
const echeanceGraphTitre = 'Répartition par échéance';

/**
 * VUE DE SYNTHESE
 */

export type TSyntheseVue = {
  id: FiltersKeys;
  titre: string;
  graphTitre: string;
  filtresSecondaires: FiltersKeys[];
};

export const generateSyntheseVue = (
  vueId: FiltersKeys
): TSyntheseVue | undefined => {
  if (vueId === 'statuts') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par statut',
      graphTitre: statutsGraphTitre,
      filtresSecondaires: ['pilotes', 'referents', 'priorites', 'echeance'],
    };
  }
  if (vueId === 'pilotes') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par personne pilote',
      graphTitre: pilotesGraphTitre,
      filtresSecondaires: ['statuts', 'referents', 'priorites', 'echeance'],
    };
  }
  if (vueId === 'referents') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par élu·e référent·e',
      graphTitre: referentsGraphTitre,
      filtresSecondaires: ['statuts', 'pilotes', 'priorites', 'echeance'],
    };
  }
  if (vueId === 'priorites') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par niveau de priorité',
      graphTitre: prioritesGraphTitre,
      filtresSecondaires: ['pilotes', 'referents', 'statuts', 'echeance'],
    };
  }
  if (vueId === 'echeance') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par échéance',
      graphTitre: echeanceGraphTitre,
      filtresSecondaires: ['pilotes', 'referents', 'statuts', 'priorites'],
    };
  }
};

/**
 * GRAPHIQUES
 */

type GraphData = {id: string; value: number; color?: any}[];

export const getGraphData = (
  graphId: FiltersKeys,
  data: TPlanActionTableauDeBord
): GraphData => {
  switch (graphId) {
    case 'statuts':
      return (
        data[graphId].map(st => ({
          ...st,
          id: st.id !== 'NC' ? st.id : 'Sans statut',
          color: statusColor[st.id],
        })) || []
      );
    case 'pilotes':
      return (
        data[graphId].map(p => ({
          ...p,
          id: p.id !== 'NC' ? p.id : 'Sans pilote',
        })) || []
      );
    case 'referents':
      return (
        data[graphId].map(r => ({
          ...r,
          id: r.id !== 'NC' ? r.id : 'Sans élu·e référent·e',
        })) || []
      );
    case 'priorites':
      return (
        data[graphId].map(prio => ({
          ...prio,
          id: prio.id !== 'NC' ? prio.id : 'Non priorisé',
        })) || []
      );
    case 'echeance':
      return (
        data['echeances'].map(echeance => ({
          ...echeance,
          id:
            echeance.id !== 'Date de fin non renseignée'
              ? echeance.id
              : 'Sans échéance',
        })) || []
      );
    default:
      return [];
  }
};

export type Graph = {
  id: FiltersKeys;
  title: string;
  data: GraphData;
};

export const generateSyntheseGraphData = (
  data: TPlanActionTableauDeBord
): Graph[] =>
  data
    ? [
        {
          id: 'statuts',
          title: statutsGraphTitre,
          data: getGraphData('statuts', data),
        },
        {
          id: 'pilotes',
          title: pilotesGraphTitre,
          data: getGraphData('pilotes', data),
        },
        {
          id: 'referents',
          title: referentsGraphTitre,
          data: getGraphData('referents', data),
        },
        {
          id: 'priorites',
          title: prioritesGraphTitre,
          data: getGraphData('priorites', data),
        },
        {
          id: 'echeance',
          title: echeanceGraphTitre,
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

export const getCustomLegend = (
  data: {id: string; value: number; color?: any}[]
) => {
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
