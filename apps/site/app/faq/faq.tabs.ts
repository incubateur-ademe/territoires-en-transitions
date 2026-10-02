/**
 * Onglets de la FAQ. Les deux premiers viennent de Strapi (champ `onglet` de la
 * collection `faq`, dont `title` reprend les valeurs) ; celui de la démarche
 * PCAET vient du code, comme la FAQ de sa page.
 */
export const FAQ_TABS = [
  { title: 'Le programme Territoire Engagé', param: 'programme' },
  { title: "L'outil numérique", param: 'outil-numerique' },
  { title: 'Démarche PCAET', param: 'demarche-pcaet' },
] as const;

export const FAQ_TAB_DEMARCHE_PCAET = FAQ_TABS[2].title;
