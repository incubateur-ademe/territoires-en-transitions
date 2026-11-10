import {
  CONSOMMATIONS_FINALES_PROPERTIES,
  CONSOMMATIONS_FINALES_PROPERTIES_SNBC3,
  EMISSIONS_GES_PROPERTIES,
  EMISSIONS_GES_PROPERTIES_SNBC3,
  IndicateurSourceEnum,
  SEQUESTRATION_CARBONE_PROPERTIES,
  TrajectoirePropertiesType,
  TrajectoireSecteursType,
} from '@tet/domain/indicateurs';

export const SIMULATEUR_TERRITORIAL_URL =
  'https://planification-territoires.ecologie.gouv.fr/';

export const HELPDESK_URL =
  'https://aide.territoiresentransitions.fr/fr/article/la-trajectoire-snbc-territorialisee-bientot-disponible-sur-territoires-en-transitions-1g46muy/#3-comment-sera-t-elle-mise-a-votre-disposition';

// fichier dans le dossier `public`
export const DOC_METHODO =
  'ADEME-Methodo-Outil-trajectoire-reference_VF_Nov2024.pdf';

const NOMS_SOURCE: Record<string, string> = {
  [IndicateurSourceEnum.COLLECTIVITE]: 'Données de la collectivité',
  [IndicateurSourceEnum.RARE]: 'RARE-OREC',
};

export const getNomSource = (id: string) =>
  NOMS_SOURCE[id] ? NOMS_SOURCE[id] : id.toUpperCase();

export const INDICATEURS_TRAJECTOIRE_IDS = [
  'emissions_ges',
  'consommations_finales',
  'sequestration_carbone',
] as const;

export type IndicateurTrajectoireId =
  (typeof INDICATEURS_TRAJECTOIRE_IDS)[number];
// liste des indicateurs Trajectoire
export const INDICATEURS_TRAJECTOIRE: {
  emissions_ges: IndicateurTrajectoire &
    TrajectoirePropertiesType<TrajectoireSecteursType>;
  consommations_finales: IndicateurTrajectoire &
    TrajectoirePropertiesType<TrajectoireSecteursType>;
  sequestration_carbone: IndicateurTrajectoire &
    TrajectoirePropertiesType<string>;
} = {
  emissions_ges: {
    id: 'emissions_ges',
    nom: 'Émissions GES',
    titre: 'Comparaison des trajectoires d’émissions de GES',
    titreSecteur: "Détail de la trajectoire d'émissions de GES",
    ...EMISSIONS_GES_PROPERTIES,
  },
  consommations_finales: {
    id: 'consommations_finales',
    nom: 'Consommations finales',
    titre: 'Comparaison des trajectoires de consommations finales',
    titreSecteur: 'Détail de la trajectoire de consommations finales',
    ...CONSOMMATIONS_FINALES_PROPERTIES,
  },
  sequestration_carbone: {
    id: 'sequestration_carbone',
    nom: '',
    titre: '',
    titreSecteur: '',
    ...SEQUESTRATION_CARBONE_PROPERTIES,
  },
} as const;

/**
 * Variante SNBC 3 : sous-secteur « Construction » dans l'industrie. Remplacera
 * `INDICATEURS_TRAJECTOIRE` à la généralisation (lot 6).
 */
export const INDICATEURS_TRAJECTOIRE_SNBC3: typeof INDICATEURS_TRAJECTOIRE = {
  emissions_ges: {
    ...INDICATEURS_TRAJECTOIRE.emissions_ges,
    ...EMISSIONS_GES_PROPERTIES_SNBC3,
  },
  consommations_finales: {
    ...INDICATEURS_TRAJECTOIRE.consommations_finales,
    ...CONSOMMATIONS_FINALES_PROPERTIES_SNBC3,
  },
  sequestration_carbone: INDICATEURS_TRAJECTOIRE.sequestration_carbone,
};

export const INDICATEUR_TRAJECTOIRE_IDENTFIANTS: string[] = Object.values(
  INDICATEURS_TRAJECTOIRE
).flatMap((t) => [t.identifiant, ...t.secteurs.map((s) => s.identifiant)]);

export const METHODO_PAR_SECTEUR: Record<
  TrajectoireSecteursType,
  {
    snbc2: string[];
    pivots?: string[];
  }
> = {
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

/**
 * Méthodologie SNBC 3 par secteur, sur le modèle de `METHODO_PAR_SECTEUR` :
 * - `snbc3` : ce que prévoit la SNBC 3 pour le secteur, sans chiffre : ils
 *   changent avec chaque release. L'évolution du territoire est calculée dans
 *   la page (`evolution-trajectoire.utils.ts`), et les objectifs nationaux
 *   chiffrés sont dans le PDF de méthodologie ;
 * - `pivots` : répartition entre territoires, d'après le rapport de
 *   méthodologie V2.2 (§3.4 et 3.5, CSC §3.5.10, aérien et maritime §4.7) ;
 * - `precisions` : lien avec les sous-secteurs affichés dans TeT
 *   (correspondance du lot 1 du plan SNBC 3).
 * Remplacera `METHODO_PAR_SECTEUR` au lot 6.
 */
export const METHODO_PAR_SECTEUR_SNBC3: Record<
  TrajectoireSecteursType,
  { snbc3: string[]; pivots: string[]; precisions?: string[] }
> = {
  Résidentiel: {
    snbc3: [
      "La SNBC 3 prévoit une forte baisse des émissions de GES du résidentiel d'ici 2050.",
      "Les consommations d'énergie baissent moins : la baisse des émissions repose surtout sur le passage à des énergies décarbonées.",
    ],
    pivots: [
      "Le chauffage est réparti entre les territoires selon le nombre de maisons et d'appartements occupés en résidence principale, corrigé de la rigueur climatique locale.",
      'La climatisation suit le nombre de résidences principales, corrigé des besoins de rafraîchissement. Les autres usages suivent le nombre de ménages.',
      'La démographie du territoire est prise en compte, et le point de départ est ajusté sur les données observées en 2021.',
    ],
    precisions: ['La climatisation est comptée dans « Autres usages ».'],
  },
  Tertiaire: {
    snbc3: [
      "La SNBC 3 prévoit une forte baisse des émissions de GES du tertiaire d'ici 2050.",
      "Les consommations d'énergie évoluent peu : la baisse des émissions repose surtout sur le passage à des énergies décarbonées.",
    ],
    pivots: [
      "La trajectoire nationale est répartie selon le nombre d'emplois tertiaires du territoire (commerce, services, administration, enseignement, santé).",
      'Le chauffage et la climatisation sont corrigés de la rigueur climatique locale.',
      'La démographie est prise en compte, et le point de départ est ajusté sur les données observées en 2021.',
    ],
    precisions: ['La climatisation est comptée dans « Autres usages ».'],
  },
  Industrie: {
    snbc3: [
      "La SNBC 3 prévoit une forte baisse des émissions de GES de l'industrie d'ici 2050.",
      "Les consommations d'énergie évoluent moins, avec de fortes différences entre filières.",
    ],
    pivots: [
      "La trajectoire de chaque filière (chimie, construction, métaux, agro-industries…) est répartie selon le nombre d'emplois salariés de la filière sur le territoire.",
      "Quelques sites très émetteurs peuvent peser bien plus que leurs emplois : le total de l'industrie est donc ajusté sur les données observées du territoire en 2021.",
    ],
    precisions: [
      "Le sous-secteur « Construction » est nouveau avec la SNBC 3 : il est inclus dans le total de l'industrie.",
      "La consommation d'énergie des procédés de captage du carbone est comptée dans « Autres industries ».",
    ],
  },
  Agriculture: {
    snbc3: [
      "La SNBC 3 prévoit une baisse des émissions de GES de l'agriculture, moins marquée que dans les autres secteurs.",
      "L'essentiel de ces émissions ne vient pas de l'énergie, mais de l'élevage et des pratiques culturales (méthane et protoxyde d'azote, convertis en équivalent CO2).",
    ],
    pivots: [
      "Les émissions agricoles dépendent surtout de l'orientation du territoire, élevage ou cultures, qui n'évoluent pas au même rythme dans la SNBC 3.",
      "Les émissions de l'élevage sont réparties selon les cheptels, celles des cultures selon les surfaces cultivées et les prairies, et celles des engins et bâtiments selon la surface agricole utile.",
      'Le point de départ est ajusté sur les données observées du territoire en 2021.',
    ],
    precisions: [
      "« Elevage » regroupe les bovins, porcins, volailles et autres émissions de l'élevage ; « Pratiques culturales » regroupe les engrais, la pâture et les autres émissions des cultures ; « Energie » correspond aux engins et bâtiments.",
    ],
  },
  Transports: {
    snbc3: [
      "La SNBC 3 prévoit la quasi-disparition des émissions de GES des transports d'ici 2050, avec une forte baisse des consommations d'énergie.",
    ],
    pivots: [
      'Les trajets domicile-travail en voiture sont répartis selon les déplacements réels des habitants du territoire.',
      'Les autres trajets en voiture, les utilitaires, les poids lourds, les bus et les cars suivent le nombre de véhicules immatriculés sur le territoire ; ceux en deux-roues, le nombre de ménages.',
      "Le ferroviaire, le fluvial, le maritime et l'aérien sont répartis selon les émissions observées du territoire.",
      'Le total du transport routier est ajusté sur les données observées en 2021, et la démographie est prise en compte.',
    ],
    precisions: [
      '« Routier / mobilité locale » regroupe les trajets domicile-travail en voiture, les deux-roues, les bus et les cars ; « Routier / autre » regroupe les autres trajets en voiture, les utilitaires et les poids lourds.',
      "Le poste « Autres » est compté là où se trouvent les infrastructures : l'essentiel de l'aérien et du maritime revient au territoire qui porte l'aéroport ou le port principal. Dans les DROM, il peut représenter une part importante des émissions de l'EPCI concerné.",
    ],
  },
  Déchets: {
    snbc3: [
      'La SNBC 3 prévoit une baisse des émissions de GES des déchets.',
      "Dans l'Hexagone, les consommations d'énergie des déchets évoluent comme celles de l'industrie.",
    ],
    pivots: [
      "Les émissions des déchets dépendent de l'emplacement de quelques installations de traitement : la trajectoire nationale est répartie selon les émissions observées du territoire en 2021.",
      'La démographie est prise en compte.',
    ],
  },
  'Branche énergie': {
    snbc3: [
      "La SNBC 3 prévoit une forte baisse des émissions de GES de la branche énergie d'ici 2050.",
      'La branche énergie regroupe le raffinage, la transformation et le transport des produits énergétiques. Les émissions des centrales électriques et des réseaux de chaleur sont comptées dans les secteurs qui consomment cette électricité et cette chaleur.',
    ],
    pivots: [
      "Les émissions dépendent de l'emplacement de quelques installations (raffineries, dépôts) : la trajectoire nationale est répartie selon les émissions observées du territoire en 2021.",
      "Seules les émissions sont territorialisées : la branche énergie n'a pas de trajectoire de consommation.",
    ],
  },
  UTCATF: {
    snbc3: [
      "Le secteur « Utilisation des terres, changement d'affectation des terres et foresterie » regroupe les flux de carbone des forêts, des sols et des produits bois. Ce sont surtout des séquestrations, c'est-à-dire des émissions « négatives ».",
    ],
    pivots: [
      "Chaque territoire part de ses propres flux de carbone, estimés par l'outil ALDO de l'ADEME.",
      'Il évolue ensuite dans le même sens que la trajectoire nationale, en proportion de son poids dans le puits national.',
      'Les produits bois sont comptés sur le territoire où le bois est récolté, et non là où il est utilisé.',
    ],
    precisions: [
      'Les sols forestiers hors inventaire sont comptés avec les forêts.',
      'Une valeur négative correspond à une émission nette, cas fréquent des cultures et des sols artificiels.',
      "L'UTCATF n'est pas modélisé dans les DROM.",
    ],
  },
  CSC: {
    snbc3: [
      "La SNBC 3 prévoit de développer le captage et le stockage du carbone d'ici 2050, avec des technologies encore expérimentales : captage du CO2 d'origine biologique dans l'industrie et la production d'énergie, et captage directement dans l'air.",
      "Le captage du CO2 d'origine fossile est déjà déduit des émissions de l'industrie.",
    ],
    pivots: [
      "Le captage dans l'industrie est réparti selon les émissions industrielles observées du territoire.",
      "Le captage lié à la production d'énergie et le captage dans l'air, qui ne sont rattachés à aucun site connu, sont répartis selon la population.",
      "Cette trajectoire indique la contribution moyenne du territoire à l'objectif national : l'emplacement réel des futurs projets ne peut pas être anticipé.",
    ],
    precisions: [
      "La consommation d'énergie des procédés de captage est comptée dans « Autres industries ».",
      "Aucun captage n'est prévu dans les DROM.",
    ],
  },
};

export type IndicateurTrajectoire = TrajectoirePropertiesType & {
  id: 'emissions_ges' | 'consommations_finales' | 'sequestration_carbone';
  nom: string;
  titre: string;
  titreSecteur: string;
};
