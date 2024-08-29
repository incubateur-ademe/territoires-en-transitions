export const TABS = [
  {
    id: 'emissions_ges',
    label: 'Données GES 2015 (ktCO2)',
    description:
      "Pour assurer la cohérence des calculs, n'entrer ici que les valeurs au format PCAET. Pour ces données, nous recommandons d’utiliser les données issues de votre observatoire. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant. Si disponibles, privilégiez les données RARE-OREC et utilisez les données CITEPA uniquement en complément.",
  },
  {
    id: 'sequestration_carbone',
    label: 'Séquestration carbone 2015 (ktCO2)',
    description:
      'Attention : en cas de séquestration, entrez des valeurs négatives. Pour ces données, nous recommandons d’utiliser les données issues d’ALDO. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant.',
  },
  {
    id: 'consommations_finales',
    label: 'Consommation d’énergie 2015 (GWh)',
    description:
      'Pour ces données, nous recommandons d’utiliser les données issues de votre observatoire. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant.',
  },
] as const;

export type TabInfo = (typeof TABS)[number];
export type TabId = (typeof TABS)[number]['id'];
