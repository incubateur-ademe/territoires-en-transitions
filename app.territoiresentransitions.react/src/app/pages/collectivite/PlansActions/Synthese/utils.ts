import {statusColor} from 'ui/charts/chartsTheme';
import {FiltersKeys} from '../FicheAction/data/filters';
import {TPlanActionTableauDeBord} from './data/usePlanActionTableauDeBord';

type TSyntheseVue = {
  id: FiltersKeys;
  titre: string;
  filtresSecondaires: FiltersKeys[];
};

export const generateSyntheseVue = (
  vueId: FiltersKeys
): TSyntheseVue | undefined => {
  if (vueId === 'statuts') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par statut',
      filtresSecondaires: ['pilotes', 'referents', 'priorites', 'echeance'],
    };
  }
  if (vueId === 'pilotes') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par personne pilote',
      filtresSecondaires: ['statuts', 'referents', 'priorites', 'echeance'],
    };
  }
  if (vueId === 'referents') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par élu·e référent·e',
      filtresSecondaires: ['statuts', 'pilotes', 'priorites', 'echeance'],
    };
  }
  if (vueId === 'priorites') {
    return {
      id: vueId,
      titre: 'Répartition des fiches par niveau de priorité',
      filtresSecondaires: ['pilotes', 'referents', 'statuts', 'echeance'],
    };
  }
};

type Graph = {
  id: FiltersKeys;
  title: string;
  data: {id: string; value: number; color?: any}[];
};

export const generateSyntheseGraphData = (
  data: TPlanActionTableauDeBord
): Graph[] =>
  data
    ? [
        {
          id: 'statuts',
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
