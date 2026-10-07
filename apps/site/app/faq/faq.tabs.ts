/**
 * Onglets de la FAQ : `title` reprend les valeurs du champ `onglet` de la
 * collection Strapi `faq`, et doit rester identique.
 */
export const FAQ_TABS = [
  { title: 'Le programme Territoire Engagé', param: 'programme' },
  { title: "L'outil numérique", param: 'outil-numerique' },
  { title: 'Démarche PCAET', param: 'demarche-pcaet' },
] as const;

export const FAQ_TAB_DEMARCHE_PCAET = FAQ_TABS[2].title;
