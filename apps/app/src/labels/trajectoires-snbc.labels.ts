import { TrajectoireSecteursType } from '@tet/domain/indicateurs';

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
 * Remplacera `METHODO_PAR_SECTEUR` (`trajectoire-constants.ts`) au lot 6.
 */
const methodologieParSecteurSnbc3: Record<
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
      'Une valeur négative correspond à une séquestration nette, une valeur positive à une émission nette, cas fréquent des cultures et des sols artificiels.',
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

export const trajectoiresSnbcLabels = {
  trajectoireReferenceTitle: 'Trajectoire SNBC et données observées en 2015',
  trajectoireReferenceDescription:
    'Pour les secteurs résidentiel, tertiaire et agriculture, la trajectoire SNBC est calculée à partir des caractéristiques du territoire (logements, emplois, surfaces agricoles...). Ce mécanisme de territorialisation est également appliqué à l\'année de référence : ainsi, les résultats SNBC calculés en 2015 peuvent différer des données observées (disponibles dans les indicateurs ou le tableau "Recalculer la trajectoire").',
  trajectoireReferenceMethodologie:
    'Pourquoi la trajectoire peut différer des données observées ?',

  /*
   * Page Trajectoire SNBC 3 (lot 3, derrière `is-trajectoire-snbc3-enabled`).
   * Textes provisoires : à remplacer par les textes produit du lot 0 (bandeau,
   * « Ce qui change », états vides, secteurs non représentés).
   */
  trajectoireSnbc3EtObjectifs: 'Trajectoire SNBC 3 et objectifs',
  trajectoireSnbc3Millesime: ({ date }: { date: string }): string =>
    `Données SNBC 3 publiées le ${date}`,
  trajectoireSnbc3CeQuiChange: 'Ce qui change avec la SNBC 3',

  trajectoireSnbc3BandeauTitre: 'Votre trajectoire passe à la SNBC 3',
  trajectoireSnbc3BandeauDescription:
    "La trajectoire territorialisée s'appuie désormais sur la troisième Stratégie nationale bas-carbone, avec 2021 comme année de référence. Elle est calculée pour vous : il n'est plus nécessaire de compléter vos données.",
  trajectoireSnbc3BandeauFermer: 'Fermer le bandeau',

  trajectoireSnbc3ChangementsTitre: 'Ce qui change avec la SNBC 3',
  trajectoireSnbc3Changements: [
    {
      titre: 'Une nouvelle stratégie nationale.',
      desc: 'La SNBC 3 remplace la SNBC 2 : objectifs sectoriels révisés, horizon 2050 inchangé.',
    },
    {
      titre: 'Une nouvelle méthode.',
      desc: "La trajectoire nationale est territorialisée pour chaque EPCI puis recalée sur les données observées. Vous n'avez plus de données à saisir pour l'obtenir.",
    },
    { titre: 'Une nouvelle année de référence.', desc: '2021 remplace 2015.' },
    {
      titre: 'Vos objectifs et résultats sont conservés.',
      desc: "Ils sont comparés à la nouvelle trajectoire : l'écart peut changer de sens.",
    },
    {
      titre: 'Vous souhaitez utiliser vos propres données ?',
      desc: "L'outil Excel SNBC 3 autonome le permet, hors plateforme.",
    },
  ],

  trajectoireSnbc3AbsentDuMillesimeTitre:
    'Trajectoire SNBC 3 pas encore disponible pour votre territoire',
  trajectoireSnbc3AbsentDuMillesimeDescription:
    "La dernière publication de la trajectoire SNBC 3 ne couvre pas encore votre territoire, par exemple à la suite d'une fusion récente. Elle sera disponible avec une prochaine publication.",
  trajectoireSnbc3CommuneTitre:
    "La trajectoire SNBC 3 est calculée à l'échelle de l'EPCI",
  trajectoireSnbc3CommuneDescription:
    "La territorialisation de la SNBC 3 s'appuie sur les EPCI à fiscalité propre : les données nécessaires ne sont pas disponibles à l'échelle de la commune.",
  trajectoireSnbc3CommuneAvecRattachementDescription: ({
    nom,
  }: {
    nom: string;
  }): string =>
    `La territorialisation de la SNBC 3 s'appuie sur les EPCI à fiscalité propre : les données nécessaires ne sont pas disponibles à l'échelle de la commune. Vous pouvez consulter la trajectoire de ${nom}.`,
  trajectoireSnbc3SupraTitre:
    "Trajectoire SNBC 3 non disponible à l'échelle de votre collectivité",
  trajectoireSnbc3SupraDescription:
    "La territorialisation de la SNBC 3 s'appuie sur le découpage du territoire en EPCI à fiscalité propre. Le périmètre de votre collectivité ne correspond pas à ce découpage.",
  trajectoireSnbc3OutilSousTitre:
    "L'outil Excel SNBC 3 contient la trajectoire de chaque EPCI, et la méthodologie en détaille le calcul.",
  trajectoireSnbc3VoirTrajectoireDe: ({ nom }: { nom: string }): string =>
    `Voir la trajectoire de ${nom}`,
  trajectoireSnbc3TelechargerOutil: "Télécharger l'outil Excel SNBC 3",
  trajectoireSnbc3ConsulterMethodologie:
    'Télécharger la méthodologie SNBC 3 (.pdf)',

  trajectoireSnbc3SecteurNonDisponible:
    'La trajectoire SNBC 3 ne contient pas de valeur pour ce secteur sur votre territoire.',
  trajectoireSnbc3MethodologieTitre: 'Méthodologie SNBC 3',
  trajectoireSnbc3MethodologieScenario: 'SNBC 3',
  trajectoireSnbc3MethodologieObjectifsNationaux:
    'Les objectifs nationaux de chaque secteur sont détaillés dans la méthodologie.',
  trajectoireSnbc3EvolutionSecteur: ({
    indicateurId,
    evolution2030,
    evolution2050,
  }: {
    indicateurId:
      | 'emissions_ges'
      | 'consommations_finales'
      | 'sequestration_carbone';
    evolution2030: string | null;
    evolution2050: string | null;
  }): string => {
    const echeances = [
      evolution2030 && `${evolution2030} d'ici 2030`,
      evolution2050 && `${evolution2050} d'ici 2050`,
    ].filter(Boolean);
    const sujet = {
      emissions_ges: 'les émissions de GES',
      consommations_finales: "les consommations d'énergie",
      sequestration_carbone: 'la séquestration de carbone',
    }[indicateurId];
    return `Pour votre territoire, la trajectoire SNBC 3 fait évoluer ${sujet} de ce secteur de ${echeances.join(
      ' et de '
    )}, par rapport à 2021.`;
  },
  trajectoireSnbc3MethodologiePrecisions: 'Dans Territoires en Transitions',
  trajectoireSnbc3MethodologieParSecteur: methodologieParSecteurSnbc3,
  trajectoireErreurChargementObjectifsResultats:
    'Erreur lors du chargement des objectifs et résultats de la collectivité',
  trajectoireSnbc3AllerPlusLoinOutil:
    "Rejouer le calcul avec vos propres données d'inventaire.",

  trajectoireLeviersSecteursNonRepresentes: ({
    secteurs,
  }: {
    secteurs: string;
  }): string => `Secteurs non représentés faute de données : ${secteurs}`,
};
