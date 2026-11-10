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
  trajectoireSnbc3CommuneAvecEpciDescription:
    "La territorialisation de la SNBC 3 s'appuie sur les EPCI à fiscalité propre : les données nécessaires ne sont pas disponibles à l'échelle de la commune. Vous pouvez consulter la trajectoire de votre EPCI.",
  trajectoireSnbc3SupraTitre:
    "Trajectoire SNBC 3 non disponible à l'échelle de votre collectivité",
  trajectoireSnbc3SupraDescription:
    "La territorialisation de la SNBC 3 s'appuie sur le découpage du territoire en EPCI à fiscalité propre. Le périmètre de votre collectivité ne correspond pas à ce découpage.",
  trajectoireSnbc3OutilSousTitre:
    "L'outil Excel SNBC 3 contient la trajectoire de chaque EPCI, et la méthodologie en détaille le calcul.",
  trajectoireSnbc3VoirTrajectoireEpci: 'Voir la trajectoire de mon EPCI',
  trajectoireSnbc3VoirTrajectoireEpciNom: ({ nom }: { nom: string }): string =>
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
  trajectoireSnbc3AllerPlusLoinOutil:
    "Rejouer le calcul avec vos propres données d'inventaire.",

  trajectoireLeviersSecteursNonRepresentes: ({
    secteurs,
  }: {
    secteurs: string;
  }): string => `Secteurs non représentés faute de données : ${secteurs}`,
};
