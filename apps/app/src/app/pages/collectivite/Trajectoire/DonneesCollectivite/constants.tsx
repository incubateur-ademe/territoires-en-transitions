export const TABS = [
  {
    id: 'emissions_ges',
    label: 'Données GES 2015 (ktCO2)',
    description:
      "Pour assurer la cohérence des calculs, n'entrer ici que les valeurs au format PCAET. Pour ces données, nous recommandons d’utiliser les données issues de votre observatoire. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant. Si disponibles, privilégiez les données RARE-OREC et utilisez les données CITEPA uniquement en complément.",
    // pour cette trajectoire, les secteurs d'entrée sont différents des secteurs de sortie de la trajectoire définis dans `../constants.ts`
    secteurs: [
      {
        nom: 'Résidentiel',
        identifiant: 'cae_1.c',
      },
      {
        nom: 'Tertiaire',
        identifiant: 'cae_1.d',
      },
      {
        nom: 'Industrie hors branche énergie',
        identifiant: 'cae_1.i',
      },
      {
        nom: 'Agriculture',
        identifiant: 'cae_1.g',
      },
      {
        nom: 'Transports routier',
        identifiant: 'cae_1.e',
      },
      {
        nom: 'Autres transports',
        identifiant: 'cae_1.f',
      },
      {
        nom: 'Déchets',
        identifiant: 'cae_1.h',
      },
      {
        nom: 'Branche énergie',
        identifiant: 'cae_1.j',
      },
    ],
  },
  {
    id: 'sequestration_carbone',
    label: 'Séquestration carbone 2015 (ktCO2)',
    description:
      'Les données sont attendues au format ALDO : positives en cas de séquestration et négatives en cas d’émission. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant, à ce format.',
  },
  {
    id: 'consommations_finales',
    label: 'Consommation d’énergie 2015 (GWh)',
    description:
      'Pour ces données, nous recommandons d’utiliser les données issues de votre observatoire. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant.',
    secteurs: [
      {
        nom: 'Résidentiel',
        identifiant: 'cae_2.e',
      },
      {
        nom: 'Tertiaire',
        identifiant: 'cae_2.f',
      },
      {
        nom: 'Industrie',
        identifiant: 'cae_2.k',
      },
      {nom: 'Agriculture', identifiant: 'cae_2.i'},
      {nom: 'Transports routiers', identifiant: 'cae_2.g'},
      {nom: 'Autres transports', identifiant: 'cae_2.h'},
      {nom: 'Déchets', identifiant: 'cae_2.j'},
      {nom: 'Branche énergie', identifiant: 'cae_2.l_pcaet'},
    ],
  },
] as const;

export type TabInfo = (typeof TABS)[number];
export type TabId = (typeof TABS)[number]['id'];
