import {
  TrajectoireSecteursEnum,
  TrajectoireSecteursType,
} from '@/domain/indicateurs';

// années de début/fin de la SNBC v2
export const ANNEE_REFERENCE = 2015;
//const ANNEE_JALON1 = 2030;
export const ANNEE_JALON2 = 2050;
export const DATE_DEBUT = `${ANNEE_REFERENCE}-01-01`;
export const DATE_FIN = `${ANNEE_JALON2}-01-01`;

export const SIMULATEUR_TERRITORIAL_URL =
  'https://planification-territoires.ecologie.gouv.fr/';

export const HELPDESK_URL =
  'https://aide.territoiresentransitions.fr/fr/article/la-trajectoire-snbc-territorialisee-bientot-disponible-sur-territoires-en-transitions-1g46muy/#3-comment-sera-t-elle-mise-a-votre-disposition';

// fichier dans le dossier `public`
export const DOC_METHODO =
  'ADEME-Methodo-Outil-trajectoire-reference_VF_Nov2024.pdf';

// sources utilisées
export enum SourceIndicateur {
  COLLECTIVITE = 'collectivite',
  RARE = 'rare',
  PCAET = 'pcaet',
  CITEPA = 'citepa',
  ALDO = 'aldo',
}

const NOMS_SOURCE: Record<string, string> = {
  [SourceIndicateur.COLLECTIVITE]: 'Données de la collectivité',
  [SourceIndicateur.RARE]: 'RARE-OREC',
};

export const getNomSource = (id: string) =>
  NOMS_SOURCE[id] ? NOMS_SOURCE[id] : id.toUpperCase();

// émissions nettes GES
export const EMISSIONS_NETTES = {
  id: 'cae_1.aa',
  nom: 'Émissions nettes',
};

// liste des indicateurs Trajectoire
export const INDICATEURS_TRAJECTOIRE = [
  {
    id: 'emissions_ges',
    nom: 'Émissions GES',
    titre: 'Comparaison des trajectoires d’émissions de GES',
    titreSecteur: "Détail de la trajectoire d'émissions de GES",
    unite: 'kteq CO2',
    identifiant: 'cae_1.a',
    sources: [
      SourceIndicateur.CITEPA,
      SourceIndicateur.RARE,
      SourceIndicateur.COLLECTIVITE,
    ],
    secteurs: [
      {
        nom: TrajectoireSecteursEnum.RÉSIDENTIEL,
        identifiant: 'cae_1.c',
        sousSecteurs: [
          {
            nom: 'Chauffage / Maisons individuelles',
            identifiant: 'cae_1.ca',
          },
          {
            nom: 'Chauffage / Logement collectif',
            identifiant: 'cae_1.cb',
          },
          {
            nom: 'Autres usages',
            identifiant: 'cae_1.cc',
          },
        ],
      },
      {
        nom: TrajectoireSecteursEnum.TERTIAIRE,
        identifiant: 'cae_1.d',
        sousSecteurs: [
          {
            nom: 'Chauffage',
            identifiant: 'cae_1.da',
          },
          {
            nom: 'Autres usages',
            identifiant: 'cae_1.db',
          },
        ],
      },
      {
        nom: TrajectoireSecteursEnum.INDUSTRIE,
        identifiant: 'cae_1.i',
        sousSecteurs: [
          {
            nom: 'Métaux primaires',
            identifiant: 'cae_1.ia',
          },
          {
            nom: 'Chimie',
            identifiant: 'cae_1.ib',
          },
          {
            nom: 'Non-métalliques',
            identifiant: 'cae_1.ic',
          },
          {
            nom: 'Agro-industries',
            identifiant: 'cae_1.id',
          },
          {
            nom: 'Equipements',
            identifiant: 'cae_1.ie',
          },
          {
            nom: 'Papier-carton',
            identifiant: 'cae_1.if',
          },
          {
            nom: 'Autres industries',
            identifiant: 'cae_1.ig',
          },
        ],
      },
      {
        nom: TrajectoireSecteursEnum.AGRICULTURE,
        identifiant: 'cae_1.g',
        sousSecteurs: [
          {
            nom: 'Energie',
            identifiant: 'cae_1.ga',
          },
          {
            nom: 'Elevage',
            identifiant: 'cae_1.gb',
          },
          {
            nom: 'Pratiques culturales',
            identifiant: 'cae_1.gc',
          },
        ],
      },
      {
        nom: TrajectoireSecteursEnum.TRANSPORTS,
        identifiant: 'cae_1.k',
        sousSecteurs: [
          {
            nom: 'Routier / mobilité locale',
            identifiant: 'cae_1.ea',
          },
          {
            nom: 'Routier / autre',
            identifiant: 'cae_1.eb',
          },
          {
            nom: 'Autres',
            identifiant: 'cae_1.f',
          },
        ],
      },
      {
        nom: TrajectoireSecteursEnum.DÉCHETS,
        identifiant: 'cae_1.h',
      },
      {
        nom: TrajectoireSecteursEnum['BRANCHE ÉNERGIE'],
        identifiant: 'cae_1.j',
      },
      {
        nom: TrajectoireSecteursEnum.UTCATF,
        identifiant: 'cae_63.a',
        sousSecteurs: [
          {
            nom: 'Forêts',
            identifiant: 'cae_63.b',
          },
          {
            nom: 'Cultures',
            identifiant: 'cae_63.ca',
          },
          {
            nom: 'Prairies',
            identifiant: 'cae_63.cb',
          },
          {
            nom: 'Zones humides',
            identifiant: 'cae_63.da',
          },
          {
            nom: 'Sols artificiels',
            identifiant: 'cae_63.db',
          },
          {
            nom: 'Produits bois',
            identifiant: 'cae_63.e',
          },
        ],
      },
      {
        nom: TrajectoireSecteursEnum.CSC,
        identifiant: 'cae_1.csc',
      },
    ],
  },
  {
    id: 'consommations_finales',
    nom: "Consommation d'énergie",
    titre: "Comparaison des trajectoires de consommation d'énergie",
    titreSecteur: "Détail de la trajectoire de consommation d'énergie",
    unite: 'GWh',
    identifiant: 'cae_2.a',
    sources: [
      SourceIndicateur.CITEPA,
      SourceIndicateur.RARE,
      SourceIndicateur.COLLECTIVITE,
    ],
    secteurs: [
      {
        nom: TrajectoireSecteursEnum.RÉSIDENTIEL,
        identifiant: 'cae_2.e',
        sousSecteurs: [
          { nom: 'Chauffage / Maisons individuelles', identifiant: 'cae_2.ea' },
          { nom: 'Chauffage / Logement collectif', identifiant: 'cae_2.eb' },
          { nom: 'Autres usages', identifiant: 'cae_2.ec' },
        ],
      },
      {
        nom: TrajectoireSecteursEnum.TERTIAIRE,
        identifiant: 'cae_2.f',
        sousSecteurs: [
          { nom: 'Chauffage', identifiant: 'cae_2.fa' },
          { nom: 'Autres usages', identifiant: 'cae_2.fb' },
        ],
      },
      {
        nom: TrajectoireSecteursEnum.INDUSTRIE,
        identifiant: 'cae_2.k',
        sousSecteurs: [
          { nom: 'Métaux primaires', identifiant: 'cae_2.ka' },
          { nom: 'Chimie', identifiant: 'cae_2.kb' },
          { nom: 'Non-métalliques', identifiant: 'cae_2.kc' },
          { nom: 'Agro-industries', identifiant: 'cae_2.kd' },
          { nom: 'Equipements', identifiant: 'cae_2.ke' },
          { nom: 'Papier-carton', identifiant: 'cae_2.kf' },
          { nom: 'Autres industries', identifiant: 'cae_2.kg' },
        ],
      },
      { nom: TrajectoireSecteursEnum.AGRICULTURE, identifiant: 'cae_2.i' },
      { nom: TrajectoireSecteursEnum.TRANSPORTS, identifiant: 'cae_2.m' },
      { nom: TrajectoireSecteursEnum.DÉCHETS, identifiant: 'cae_2.j' },
      {
        nom: TrajectoireSecteursEnum['BRANCHE ÉNERGIE'],
        identifiant: 'cae_2.l_pcaet',
      },
    ],
  },
] as const;

export const INDICATEUR_TRAJECTOIRE_IDENTFIANTS: string[] =
  INDICATEURS_TRAJECTOIRE.flatMap((t) => [
    t.identifiant,
    ...t.secteurs.map((s) => s.identifiant),
  ]);

export const METHODO_PAR_SECTEUR: {
  [key in TrajectoireSecteursType]: {
    snbc2: string[];
    pivots?: string[];
  };
} = {
  Résidentiel: {
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
  Tertiaire: {
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
  Industrie: {
    snbc2: [
      "La SNBC 2 prévoit une diminution de 19 % des consommations d'énergie finale de l'industrie manufacturière.",
      "Les consommations résiduelles s'appuient sur des vecteurs décarbonés permettant de diminuer de 81 % les émissions du secteur.",
    ],
    pivots: [
      "La territorialisation de la trajectoire industrie repose sur la ventilation des émissions et consommations par sous-secteurs industriels, d'après données d'emplois par branche (base FLORES de l'INSEE).",
      'Le point de départ est ensuite recalé avec les données observatoire.',
    ],
  },
  Agriculture: {
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
  Transports: {
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
  Déchets: {
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
  'Branche énergie': {
    snbc2: [
      "La SNBC 2 prévoit une diminution de 90 % des émissions du secteur de la branche énergie, qui regroupe consommations des équipements industriels liés à la fourniture d'énergie  (raffineries, centrales électriques, etc...)",
    ],
    pivots: [
      "Les émissions liées au secteur de la branche énergie dépendent de la localisation des infrastructures. Les données d'observatoires doivent être mobilisées pour les territorialiser.",
    ],
  },
  UTCATF: {
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
  CSC: {
    snbc2: [
      'La SNBC 2 prévoit la création de systèmes industriels de "Capture et Stockage de Carbone"',
      'Il s\'agit de flux de séquestrations, donc d\'émissions "négatives". Ces systèmes, encore expérimentaux, entrent en action en 2030. Ils sont associés à des industries particulièrement émettrices.',
    ],
  },
};

export const SEQUESTRATION_CARBONE = {
  id: 'sequestration_carbone',
  sources: [SourceIndicateur.ALDO, SourceIndicateur.COLLECTIVITE],
  secteurs: [
    {
      nom: 'Cultures',
      identifiant: 'cae_63.ca',
    },
    {
      nom: 'Prairies',
      identifiant: 'cae_63.cb',
    },
    {
      nom: 'Zones humides',
      identifiant: 'cae_63.da',
    },
    {
      nom: 'Vergers',
      identifiant: 'cae_63.cd',
    },
    {
      nom: 'Vignes',
      identifiant: 'cae_63.cc',
    },
    {
      nom: 'Sols artificiels',
      identifiant: 'cae_63.db',
    },
    {
      nom: 'Forêts',
      identifiant: 'cae_63.b',
    },
    {
      nom: 'Produits bois',
      identifiant: 'cae_63.e',
    },
  ],
} as const;

// types dérivés de la liste des indicateurs Trajectoire
export type IndicateurTrajectoire = (typeof INDICATEURS_TRAJECTOIRE)[number];
export type IndicateurTrajectoireId = IndicateurTrajectoire['id'];
export type SecteurTrajectoire = IndicateurTrajectoire['secteurs'][number];

// donne un indicateur trajectoire à partir de son id
export const getIndicateurTrajectoire = (
  id: IndicateurTrajectoireId | typeof SEQUESTRATION_CARBONE.id
) =>
  id === SEQUESTRATION_CARBONE.id
    ? SEQUESTRATION_CARBONE
    : INDICATEURS_TRAJECTOIRE.find((t) => t.id === id)!;
