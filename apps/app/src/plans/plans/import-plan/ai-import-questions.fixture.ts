import type { DoubtOf } from './ai-import-questions.model';

/** Un document qui titre ses fiches et détaille leurs étapes. */
export const actionLevelDoubt: DoubtOf<'action-level'> = {
  kind: 'action-level',
  axes: {
    exampleTitle: 'Limiter les déchets verts',
    examplePage: 31,
    count: 5,
  },
  fiches: {
    exampleTitle: 'Accompagner les habitants vers le jardinage au naturel',
    examplePage: 37,
    count: 16,
  },
  fichesWithEtapes: 16,
  etapes: {
    exampleTitle: 'Diagnostiquer et orienter',
    examplePage: 37,
    count: 54,
  },
  proposed: 'fiche',
};

/** Une synthèse qui réunit quatre thèmes écrits au-dessus des fiches. */
export const themeGroupingDoubt: DoubtOf<'theme-grouping'> = {
  kind: 'theme-grouping',
  groups: [
    {
      label: 'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX',
      labelPage: 3,
      variants: [
        {
          theme: 'BIODECHETS (végétaux)',
          fiches: 3,
          exampleTitle: 'Promouvoir le broyage des végétaux',
          page: 28,
        },
        {
          theme: 'BIODECHETS (alimentaires)',
          fiches: 2,
          exampleTitle: 'Développer le compostage partagé',
          page: 31,
        },
      ],
    },
  ],
  proposed: 'grouped',
};

/** Un récapitulatif qui liste plus d'actions que le document n'a de fiches. */
export const actionsWithoutFicheDoubt: DoubtOf<'actions-without-fiche'> = {
  kind: 'actions-without-fiche',
  listed: 51,
  withFiche: 24,
  withoutFiche: 27,
  example: {
    title:
      'Action à poursuivre 1 : Soutenir la mise en œuvre des Plans Nationaux',
    page: 48,
  },
  tablePages: [49, 48],
  proposed: 'all',
};
