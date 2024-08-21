export const HELPDESK_URL =
  'https://aide.territoiresentransitions.fr/fr/article/la-trajectoire-snbc-territorialisee-bientot-disponible-sur-territoires-en-transitions-1g46muy/#3-comment-sera-t-elle-mise-a-votre-disposition';

// fichier dans le dossier `public`
export const DOC_METHODO = 'ADEME-Methodo-Outil-trajectoire-référence.pdf';

// couleurs et libellés pour les graphes
export const COLORS = [
  '#FEF1D8',
  '#F7B1C2',
  '#A4E7C7',
  '#D8EEFE',
  '#B8D6F7',
  '#FFD0BB',
  '#FBE7B5',
  '#D9D9D9',
];
export const LAYERS = {
  objectifs: {color: '#F5895B', label: 'Mes objectifs'},
  resultats: {color: '#6A6AF4', label: 'Mes résultats'},
  trajectoire: {color: '#1E98C6', label: 'SNBC territorialisée'},
};

// liste des indicateurs Trajectoire
export const INDICATEURS_TRAJECTOIRE = [
  {
    id: 'emissions_ges',
    nom: 'Émissions GES',
    titre: 'Comparaison des trajectoires d’émissions de GES',
    unite: 'teq CO2',
    identifiant: 'cae_1.a',
    coef: 0.001, // pour normaliser les données résultats/objectifs (tCO2 => ktCO2)
    secteurs: [
      {
        nom: 'Résidentiel',
        identifiant: 'cae_1.c',
        snbc2: [
          "La SNBC 2 prévoit une diminution de 40 % des consommations d'énergie finale du résidentiel.",
          '',
          "Les consommations résiduelles s'appuient sur des vecteurs décarbonés permettant de diminuer de 94 % les émissions de GES du secteur.",
        ],
        pivots: [
          'La trajectoire nationale pour les besoins en chauffage est territorialisée à partir du nombre de maisons et appartements en résidences principales, auquel est appliqué une correction en fonction des données de rigueur climatique régionale (DJU).',
          'Les autres usages sont répartis par nombre de ménages. La démographie est également prise en compte pour les émissions et les consommations.',
        ],
      },
      {
        nom: 'Tertiaire',
        identifiant: 'cae_1.d',
        snbc2: [
          "La SNBC 2 prévoit une diminution de 41 % des consommations d'énergie finale du tertiaire.",
          '',
          "Les consommations résiduelles s'appuient sur des vecteurs décarbonés permettant de diminuer de 99 % les émissions du secteur.",
        ],
        pivots: [
          'La trajectoire nationale pour les besoins en chauffage et autres usages du tertiaire est territorialisée à partir du nombre salariés du territoire.',
          "L'usage chauffage est corrigé en fonction des données de rigueur climatique régionale (DJU).",
          'La démographie est également prise en compte pour les émissions et les consommations.',
        ],
      },
      {
        nom: 'Industrie',
        identifiant: 'cae_1.i',
        snbc2: [
          "La SNBC 2 prévoit une diminution de 19 % des consommations d'énergie finale de l'industrie manufacturière.",
          "Les consommations résiduelles s'appuient sur des vecteurs décarbonés permettant de diminuer de 81 % les émissions du secteur.",
        ],
        pivots: [
          "La territorialisation de la trajectoire industrie repose sur la ventilation des émissions et consommations par sous-secteurs industriels, d'après données d'emplois par branche (base FLORES de l'INSEE).",
          'Le point de départ est ensuite recalé avec les données observatoire.',
        ],
      },
      {
        nom: 'Agriculture',
        identifiant: 'cae_1.g',
        snbc2: [
          "La SNBC 2 prévoit une diminution de 49 % des consommations d'énergie finale du secteur de l'agriculture.",
          '',
          'Si la consommation énergétique en agriculture émet du CO2, les pratiques culturales et l\'élevage sont responsables d\'émissions importantes de NH3 et de CH4, ici converties en "équivalent CO2" (CO2eq) pour faciliter les calculs.',
        ],
        pivots: [
          "Les émissions relevées dans les territoires varient beaucoup en fonction des typologies d'agriculture.",
          "Ainsi, les émissions liées à la consommation d'énergie sont corrélées à la surface agricole utile (SAU) du territoire. De manière simplifiée, les émissions de CH4 liées à l'élevage s'appuient sur le pivot du nombre d'unités de GRos bétail (UGB), et les émissions de NH3 à la surface de terres labourables.",
        ],
      },
      {
        nom: 'Transports',
        identifiant: 'cae_1.k',
        snbc2: [
          "La SNBC 2 prévoit une diminution de 61 % des consommations d'énergie finale du secteur des transports.",
          'La trajectoire nationale pour les usages de courte distance et de longue distance est différenciée dans la SNBC.',
          "Les consommations résiduelles s'appuient sur des vecteurs décarbonés permettant de diminuer de 97 % les émissions du secteur",
        ],
        pivots: [
          "Les consommations relevées dans les territoires varient beaucoup en fonction des infrastructures locales, notamment la présence d'autoroute.",
          "Pour affiner l'analyse, les usages de mobilité du quotidien (courte distance) sont reconstituées à partir des typologies des communes qui le consitituent. Cela permet de donner un ordre d'idée de la mobilité routière locale, et de la mobilité de transit.",
          'La mobilité routière locale est réajustée selon la démographie.',
          "Par manque de données du scénario SNBC, le découpage en sous-secteurs n'est possible que sur les émissions GES, pas sur les consommations énergétiques.",
        ],
      },
      {
        nom: 'Déchets',
        identifiant: 'cae_1.h',
        snbc2: [
          'La SNBC 2 prévoit une diminution de 66 % des émissions du secteur des déchets',
        ],
        pivots: [
          "Les émissions liées au secteur des déchets dépendent de la localisation des infrastructures de traitement des déchets. Les données d'observatoires doivent être mobilisées.",
          'La démographie est prise en compte.',
          '',
          "L'évolution des consommations et émissions des déchets s'applique par défaut sur les sites de traitements existants.",
          "Par manque de données du scénario SNBC, le rythme d'évolution des consommations énergétiques du secteur déchets est calqué sur celui de l'industrie.",
        ],
      },
      {
        nom: 'Branche énergie',
        identifiant: 'cae_1.j',
        snbc2: [
          "La SNBC 2 prévoit une diminution de 90 % des émissions du secteur de la branche énergie, qui regroupe consommations des équipements industriels liés à la fourniture d'énergie  (raffineries, centrales électriques, etc...)",
        ],
        pivots: [
          "Les émissions liées au secteur de la branche énergie dépendent de la localisation des infrastructures. Les données d'observatoires doivent être mobilisées pour les territorialiser.",
        ],
      },
      {
        nom: 'UTCATF',
        identifiant: 'cae_63.a',
        snbc2: [
          'La SNBC 2 prévoit une augmentation du puits de carbone lié au secteur "Utilisation des Terres, Changements d\'Affectation des Terres et Foresterie"',
          'Il s\'agit de flux de séquestrations, donc d\'émissions "négatives"',
        ],
        pivots: [
          "Les puits de carbone dépend beaucoup de l'occupation des sols des territoires, la trajectoire de référence s'appuis sur la contribution actuelle au puits de carbone de chaque territoire.",
          '',
          "L'évolution du puits de carbone local peut s'appuyer sur différents leviers pour atteindre ces objectifs (voir onglet Leviers UTCATF)",
        ],
      },
      {
        nom: 'CSC',
        identifiant: 'cae_1.csc',
        snbc2: [
          'La SNBC 2 prévoit la création de systèmes industriels de "Capture et Stockage de Carbone"',
          'Il s\'agit de flux de séquestrations, donc d\'émissions "négatives". Ces systèmes, encore expérimentaux, entrent en action en 2030. Ils sont associés à des industries particulièrement émetrices.',
        ],
      },
    ],
  },
  {
    id: 'consommations_finales',
    nom: "Consommation d'énergie",
    titre: "Comparaison des trajectoires de consommation d'énergie",
    unite: 'GWh',
    identifiant: 'cae_2.a',
    coef: 1, // pas de normalisation
    secteurs: [
      {nom: 'Résidentiel', identifiant: 'cae_2.e'},
      {nom: 'Tertiaire', identifiant: 'cae_2.f'},
      {nom: 'Industrie', identifiant: 'cae_2.k'},
      {nom: 'Agriculture', identifiant: 'cae_2.i'},
      {nom: 'Transports', identifiant: 'cae_2.m'},
      {nom: 'Déchets', identifiant: 'cae_2.j'},
      {nom: 'Branche énergie', identifiant: 'cae_2.l_pcaet'},
    ],
  },
] as const;

// types dérivés de la liste des indicateurs Trajectoire
export type IndicateurTrajectoire = (typeof INDICATEURS_TRAJECTOIRE)[number];
export type IndicateurTrajectoireId = IndicateurTrajectoire['id'];
export type SecteurTrajectoire = IndicateurTrajectoire['secteurs'][number];
