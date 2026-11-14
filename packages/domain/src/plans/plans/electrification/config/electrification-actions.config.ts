import type { ElectrificationFichesConfig } from './electrification-fiches.config';

import { electrificationAides } from './electrification-aides.config';

/**
 * Actions du référentiel V1.3, relevé du 11 novembre 2026 (provenance : ADR 0022).
 * Les codes sous-action-xxx sont attribués une fois et restent fixes,
 * même si le titre, le parent ou l’ordre de la sous-action évolue.
 */
export const electrificationActions: NonNullable<
  ElectrificationFichesConfig['actions']
> = [
  {
    code: '1.1.1',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.1',
    champs: {
      titre:
        'Rassembler les données disponibles sur le chauffage au fioul et au gaz, et les compléter localement',
      description:
        "Des données publiques renseignent sur les modes de chauffage : BatEnR (Cerema), construit à partir de la Base de données nationale des bâtiments (BDNB), les données détenues par les espaces conseil France Rénov', les données de consommation de GRDF à la commune. La collectivité en prend connaissance, demande au gestionnaire de réseau celles qui manquent et les complète avec ce qu'elle sait du terrain, même de façon partielle : secteurs pavillonnaires, communes rurales, hameaux, copropriétés anciennes. L'outil Go Rénove du CSTB, construit lui aussi sur la BDNB, permet d'analyser le parc bâtiment par bâtiment et d'en exporter les données. Le fioul, peu visible dans les bases nationales, se repère surtout grâce aux données détenues localement : espaces conseil France Rénov', distributeurs de fioul, dossiers d'aides locales. Les retours des actions d'aller-vers peuvent aussi alimenter ce recensement, en veillant à capitaliser les informations des retours reçus.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['OUT-006'],
      electrificationAides['OUT-008'],
      electrificationAides['OUT-012'],
      electrificationAides['OUT-014'],
      electrificationAides['PAR-005'],
      electrificationAides['PAR-010'],
      electrificationAides['PAR-001'],
      electrificationAides['OUT-015'],
      electrificationAides['DSP-050'],
    ],
  },
  {
    code: '1.1.2',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.1',
    champs: {
      titre: 'Repérer les secteurs et les bâtiments à démarcher en priorité',
      description:
        "À partir des données et cartographies consolidées, la collectivité repère les secteurs et les bâtiments où l'aller-vers est le plus pertinent pour proposer aux habitants de s'électrifier : zones pavillonnaires à l'architecture homogène, zones denses desservies par un réseau de chaleur, etc.",
    },
    sousActions: [],
    indicateurCodes: ['1.1.2-a'],
    aides: [
      electrificationAides['OUT-006'],
      electrificationAides['PAR-005'],
      electrificationAides['DSP-050'],
    ],
  },
  {
    code: '1.2.1',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.2',
    champs: {
      titre:
        "Aller au-devant des ménages repérés et les accompagner jusqu'au changement de mode de chauffage",
      description:
        "En s'appuyant sur les espaces conseil France Rénov' et les dispositifs de l'Anah, aller au-devant des ménages repérés : porte-à-porte, appel téléphonique, ou courrier renvoyant vers les simulateurs du site electrifions-la-france.gouv.fr et vers l'espace conseil. Les relais d'aller-vers peuvent y aider : facteurs et bureaux de La Poste, application Wattwatchers, dont les données seraient transmises aux espaces conseil locaux. Lorsque la collectivité a déjà confié une mission de suivi-animation à un opérateur dans le cadre d'une opération programmée d'amélioration de l'habitat (OPAH, PIG), l'aller-vers peut s'appuyer sur lui. Chaque ménage est ensuite pris en charge par l'espace conseil France Rénov', qui lui apporte un conseil adapté à sa situation (logement, type de bâti, ressources). Pour une rénovation d'ampleur, il est orienté vers Mon Accompagnateur Rénov', obligatoire dans ce cas.",
    },
    sousActions: [
      {
        code: 'sous-action-001',
        champs: {
          titre:
            'Prendre contact directement avec les ménages repérés (porte-à-porte, téléphone)',
        },
      },
      {
        code: 'sous-action-002',
        champs: {
          titre: 'Envoyer un courrier aux foyers concernés',
        },
      },
      {
        code: 'sous-action-003',
        champs: {
          titre: "Proposer l'application Wattwatchers",
        },
      },
      {
        code: 'sous-action-004',
        champs: {
          titre: "Orienter chaque ménage vers l'espace conseil France Rénov'",
        },
      },
      {
        code: 'sous-action-005',
        champs: {
          titre:
            "Intégrer l'électrification du chauffage aux opérations programmées en cours (OPAH, PIG)",
        },
      },
    ],
    indicateurCodes: ['1.2.1-a', '1.2.1-b', '1.2.1-c'],
    aides: [
      electrificationAides['DSP-005'],
      electrificationAides['DSP-007'],
      electrificationAides['DSP-036'],
      electrificationAides['DSP-006'],
      electrificationAides['DSP-042'],
      electrificationAides['DSP-008'],
      electrificationAides['DSP-050'],
      electrificationAides['OUT-008'],
      electrificationAides['PAR-001'],
      electrificationAides['PAR-030'],
      electrificationAides['PAR-020'],
      electrificationAides['PAR-019'],
      electrificationAides['DSP-053'],
      electrificationAides['PAR-031'],
      electrificationAides['DSP-061'],
    ],
  },
  {
    code: '1.2.2',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.2',
    champs: {
      titre: 'Informer les habitants au plus près de chez eux',
      description:
        "En s'appuyant sur le réseau France Rénov' : plan de communication sur les aides et l'accompagnement disponibles localement ; permanences de l'espace conseil France Rénov' dans chaque commune membre, ou dans une partie d'entre elles, pour couvrir tout le territoire (bâtiments publics, bureaux de poste, maisons France Services) ; stands lors des événements locaux. En copropriété, information organisée avec les syndics (affichage, réunions), qui en ont la main.",
    },
    sousActions: [
      {
        code: 'sous-action-006',
        champs: {
          titre:
            "Diffuser un plan de communication sur les aides et l'accompagnement",
        },
      },
      {
        code: 'sous-action-007',
        champs: {
          titre: 'Tenir des permanences dans les communes membres',
        },
      },
      {
        code: 'sous-action-008',
        champs: {
          titre: 'Informer les copropriétés avec les syndics',
        },
      },
    ],
    indicateurCodes: ['1.2.2-a'],
    aides: [
      electrificationAides['DSP-042'],
      electrificationAides['DSP-050'],
      electrificationAides['PAR-001'],
      electrificationAides['PAR-020'],
    ],
  },
  {
    code: '1.2.3',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.2',
    champs: {
      titre:
        "Faire visiter des maisons du territoire déjà équipées d'une pompe à chaleur",
      description:
        'Visites chez des habitants volontaires, qui témoignent de leur expérience. Un parrainage peut être proposé : le ménage équipé accompagne un voisin dans sa démarche.',
    },
    sousActions: [],
    indicateurCodes: ['1.2.3-a'],
    aides: [electrificationAides['PAR-030']],
  },
  {
    code: '1.2.4',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.2',
    champs: {
      titre: "Proposer aux habitants un achat groupé d'électricité",
      description:
        "La collectivité organise ou relaie une offre groupée de fourniture d'électricité ouverte aux habitants, avec un opérateur choisi par mise en concurrence. Les habitants qui s'inscrivent bénéficient d'un prix négocié et reçoivent aussi des conseils pour électrifier leur logement : information sur les aides au remplacement d'une chaudière au fioul ou au gaz, orientation vers l'espace conseil France Rénov', relais des achats groupés de pompes à chaleur (fiche 1.2.5).",
    },
    sousActions: [
      {
        code: 'sous-action-009',
        champs: {
          titre: "Choisir l'opérateur de l'achat groupé",
        },
      },
      {
        code: 'sous-action-010',
        champs: {
          titre:
            "Associer à la campagne une information sur l'électrification du chauffage",
        },
      },
    ],
    indicateurCodes: ['1.2.4-a'],
    aides: [electrificationAides['DSP-050'], electrificationAides['PAR-030']],
  },
  {
    code: '1.2.5',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.2',
    champs: {
      titre: 'Organiser des achats groupés de pompes à chaleur',
      description:
        "Regrouper les projets des ménages d'un même quartier ou d'une même commune pour obtenir de meilleurs prix et des délais tenus auprès d'installateurs locaux, en s'inspirant des opérations déjà menées : par exemple, l'entreprise « Ressorts » a conduit en Gironde un projet d'achat groupé de pompes à chaleur, en réponse à un appel à projets européen.",
    },
    sousActions: [],
    indicateurCodes: ['1.2.5-a'],
    aides: [
      electrificationAides['DSP-007'],
      electrificationAides['DOC-006'],
      electrificationAides['PAR-018'],
      electrificationAides['PAR-017'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '1.3.1',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.3',
    champs: {
      titre: 'Aider les ménages à retirer ou neutraliser leur cuve à fioul',
      description:
        "Le devenir de la cuve freine souvent le passage à l'action. La collectivité propose un appui technique, administratif ou financier : information sur les obligations, mise en relation avec des entreprises, aide éventuelle au coût.",
    },
    sousActions: [],
    indicateurCodes: ['1.3.1-a'],
    aides: [],
  },
  {
    code: '1.3.2',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.3',
    champs: {
      titre:
        "Prêter ou louer un chauffage d'appoint électrique aux ménages dont la chaudière tombe en panne",
      description:
        "Quand la chaudière tombe en panne en hiver, elle est souvent remplacée à l'identique faute de temps. Un chauffage d'appoint prêté ou loué permet de combler le besoin en chaffage et de prendre le temps d'installer une pompe à chaleur.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [],
  },
  {
    code: '1.4.1',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.4',
    champs: {
      titre:
        'Animer le réseau des chauffagistes, des distributeurs de fioul et des professionnels de la rénovation',
      description:
        "Dans le cadre des espaces conseil France Rénov' et des pactes territoriaux, réunir régulièrement ces professionnels et conventionner avec eux : signalement des chaudières en fin de vie lors de l'entretien annuel, orientation des clients vers France Rénov', transmission des adresses des foyers équipés dans le respect des règles de protection des données. Proposer aux distributeurs de fioul de se diversifier vers l'installation et l'entretien de pompes à chaleur. La mobilisation des professionnels fait partie des missions de l'espace conseil ; lorsque le pacte territorial est porté par une autre structure, ou qu'il n'y en a pas sur le territoire, la collectivité organise cette animation avec l'espace conseil le plus proche.",
    },
    sousActions: [
      {
        code: 'sous-action-011',
        champs: {
          titre:
            'Réunir régulièrement les chauffagistes, les distributeurs de fioul et les professionnels de la rénovation',
        },
      },
      {
        code: 'sous-action-012',
        champs: {
          titre:
            "Conventionner avec eux (signalement des chaudières en fin de vie, orientation vers France Rénov')",
        },
      },
      {
        code: 'sous-action-013',
        champs: {
          titre:
            'Proposer aux distributeurs de fioul de se diversifier vers la pompe à chaleur',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['DOC-006'],
      electrificationAides['PAR-017'],
      electrificationAides['PAR-001'],
      electrificationAides['PAR-030'],
    ],
  },
  {
    code: '1.4.2',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.4',
    champs: {
      titre:
        "Saisir l'occasion des ventes immobilières pour proposer aux acquéreurs de changer de mode de chauffage",
      description:
        "Dans le cadre des espaces conseil France Rénov' et des pactes territoriaux, conventionner avec les notaires, les agences immobilières, les banques et les courtiers pour que l'acquéreur d'un logement chauffé au fioul ou au gaz soit systématiquement orienté vers l'espace conseil France Rénov', dès la promesse de vente ou au moment du prêt, pour une information sur les aides et l'offre locale. Lorsque le pacte territorial est porté par une autre structure, ou qu'il n'y en a pas sur le territoire, la collectivité s'appuie directement sur l'espace conseil le plus proche. Le programme Actimmo, mené de 2019 à 2021, en offre un retour d'expérience.",
    },
    sousActions: [
      {
        code: 'sous-action-014',
        champs: {
          titre: 'Conventionner avec les notaires',
        },
      },
      {
        code: 'sous-action-015',
        champs: {
          titre: 'Conventionner avec les agences immobilières',
        },
      },
      {
        code: 'sous-action-016',
        champs: {
          titre: 'Conventionner avec les banques et les courtiers',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-005'],
      electrificationAides['DSP-006'],
      electrificationAides['PAR-001'],
      electrificationAides['PAR-030'],
      electrificationAides['DOC-010'],
    ],
  },
  {
    code: '1.4.3',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.4',
    champs: {
      titre:
        "Faire inscrire le remplacement des chaudières collectives à l'ordre du jour des assemblées générales de copropriété",
      description:
        "Le remplacement d'une chaudière collective se décide en assemblée générale, sur un cycle long. Conventionner avec les syndics pour les faire inscrire le sujet à l'ordre du jour et dans le plan pluriannuel de travaux, en profitant des autres travaux prévus (ravalement, toiture…). Les aider à préparer la décision : projet de résolution, calendrier, financements collectifs mobilisables. Le changement de chauffage s'articule avec la rénovation de l'enveloppe lorsque l'installation d'une pompe à chaleur collective le demande. Cette animation peut s'inscrire dans les missions de l'espace conseil France Rénov'.",
    },
    sousActions: [
      {
        code: 'sous-action-017',
        champs: {
          titre: 'Conventionner avec les syndics de copropriété',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-005'],
      electrificationAides['PAR-001'],
      electrificationAides['PAR-014'],
      electrificationAides['PAR-030'],
    ],
  },
  {
    code: '1.5.1',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.5',
    champs: {
      titre:
        'Raccorder davantage de bâtiments aux réseaux de chaleur existants',
      description:
        "Classer les réseaux existants pour rendre le raccordement obligatoire dans leur périmètre, et l'anticiper dans les permis de construire. Informer les copropriétés et les bâtiments privés proches du réseau (réunions, porte-à-porte).",
    },
    sousActions: [
      {
        code: 'sous-action-018',
        champs: {
          titre: 'Classer les réseaux de chaleur existants',
        },
      },
      {
        code: 'sous-action-019',
        champs: {
          titre: 'Informer les copropriétés et les bâtiments proches du réseau',
        },
      },
    ],
    indicateurCodes: ['1.5-a', '1.5.1-a'],
    aides: [
      electrificationAides['DSP-025'],
      electrificationAides['OUT-007'],
      electrificationAides['PAR-015'],
      electrificationAides['PAR-016'],
      electrificationAides['PAR-005'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '1.5.2',
    validation: 'validated',
    axeNumero: 1,
    sousAxeNumero: '1.5',
    champs: {
      titre:
        'Créer de nouveaux réseaux de chaleur renouvelable ou étendre les réseaux existants',
      description:
        "Faire réaliser les études d'opportunité puis de faisabilité, et déposer les demandes de financement auprès de l'ADEME (Fonds Chaleur), pour les études puis pour l'investissement.",
    },
    sousActions: [
      {
        code: 'sous-action-020',
        champs: {
          titre: "Faire réaliser l'étude d'opportunité",
        },
      },
      {
        code: 'sous-action-021',
        champs: {
          titre: "Faire réaliser l'étude de faisabilité",
        },
      },
      {
        code: 'sous-action-022',
        champs: {
          titre: 'Déposer la demande de financement au Fonds Chaleur',
        },
      },
    ],
    indicateurCodes: ['1.5-a', '1.5.2-a'],
    aides: [
      electrificationAides['DSP-025'],
      electrificationAides['OUT-007'],
      electrificationAides['DSP-001'],
      electrificationAides['PAR-015'],
      electrificationAides['PAR-016'],
      electrificationAides['PAR-005'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '2.1.1',
    validation: 'validated',
    axeNumero: 2,
    sousAxeNumero: '2.1',
    champs: {
      titre: 'Cartographier les logements sociaux chauffés au gaz',
      description:
        'Avec les bailleurs présents sur le territoire : résidences concernées, mode de chauffage (individuel ou collectif), consommations.',
    },
    sousActions: [],
    indicateurCodes: ['2.1.1-a'],
    aides: [
      electrificationAides['OUT-006'],
      electrificationAides['OUT-013'],
      electrificationAides['PAR-012'],
      electrificationAides['PAR-003'],
    ],
  },
  {
    code: '2.1.2',
    validation: 'validated',
    axeNumero: 2,
    sousAxeNumero: '2.1',
    champs: {
      titre:
        'Repérer les résidences qui peuvent changer de chauffage à court ou moyen terme',
      description:
        "Critères : travaux de rénovation déjà programmés, chaudière collective ancienne (gaz ou fioul), proximité d'un réseau de chaleur.",
    },
    sousActions: [],
    indicateurCodes: ['2.1.2-a'],
    aides: [electrificationAides['PAR-012'], electrificationAides['PAR-003']],
  },
  {
    code: '2.2.1',
    validation: 'validated',
    axeNumero: 2,
    sousAxeNumero: '2.2',
    champs: {
      titre:
        'Intégrer la sortie du gaz dans les plans stratégiques de patrimoine des bailleurs',
      description:
        "Chaque bailleur dispose d'un plan stratégique de patrimoine qui programme ses opérations lourdes sur dix ans. Une revue annuelle avec chaque bailleur permet de repérer les opérations où le choix de l'énergie n'est pas encore arrêté.",
    },
    sousActions: [],
    indicateurCodes: ['2.2.1-a', '2.2.1-b'],
    aides: [electrificationAides['PAR-012']],
  },
  {
    code: '2.2.2',
    validation: 'validated',
    axeNumero: 2,
    sousAxeNumero: '2.2',
    champs: {
      titre:
        "Convenir avec chaque bailleur d'un calendrier pluriannuel d'opérations",
      description:
        "Convention précisant les opérations et leur calendrier, en privilégiant d'abord le raccordement à un réseau de chaleur lorsque c'est possible, puis les solutions collectives : pompe à chaleur, géothermie de surface, solaire thermique en appoint. Dans la discussion, la collectivité peut faire valoir les garanties d'emprunt qu'elle accorde aux bailleurs, en les conditionnant ou en les bonifiant (quotité, priorité d'instruction) pour les opérations qui intègrent la sortie du gaz.",
    },
    sousActions: [
      {
        code: 'sous-action-023',
        champs: {
          titre:
            "Modifier le règlement des garanties d'emprunt de la collectivité",
        },
      },
    ],
    indicateurCodes: ['2.2.2-a', '2.2.2-b'],
    aides: [electrificationAides['PAR-012']],
  },
  {
    code: '2.2.3',
    validation: 'validated',
    axeNumero: 2,
    sousAxeNumero: '2.2',
    champs: {
      titre:
        "Aider les bailleurs à sécuriser leurs financements et suivre l'avancement des travaux",
      description:
        "Mobiliser les financements adaptés : en premier lieu les certificats d'économies d'énergie (Coup de pouce chauffage des bâtiments collectifs) et le Fonds Chaleur, complétés par les prêts de la Banque des Territoires (éco-PLS, prêt à l'amélioration). Suivre le dépôt des dossiers et l'avancement des chantiers.",
    },
    sousActions: [],
    indicateurCodes: ['2.2.3-a'],
    aides: [
      electrificationAides['DSP-016'],
      electrificationAides['DSP-017'],
      electrificationAides['DSP-025'],
      electrificationAides['DSP-051'],
      electrificationAides['PAR-003'],
      electrificationAides['PAR-012'],
    ],
  },
  {
    code: '2.3.1',
    validation: 'validated',
    axeNumero: 2,
    sousAxeNumero: '2.3',
    champs: {
      titre:
        "Suivre l'évolution des charges et de la précarité énergétique des locataires",
      description:
        'Avec les bailleurs : évolution des charges de chauffage après travaux, indicateurs de précarité énergétique.',
    },
    sousActions: [],
    indicateurCodes: ['2.3.1-a'],
    aides: [electrificationAides['PAR-012'], electrificationAides['PAR-013']],
  },
  {
    code: '2.3.2',
    validation: 'validated',
    axeNumero: 2,
    sousAxeNumero: '2.3',
    champs: {
      titre: 'Consolider le travail en écosystème des bailleurs',
      description:
        "Partager entre les bailleurs du territoire les réalisations exemplaires et mutualiser les ressources : achats groupés, cahiers des charges types, retours d'expérience sur les solutions techniques.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-012']],
  },
  {
    code: '3.1.1',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.1',
    champs: {
      titre:
        "Réaliser l'inventaire des chaudières fioul et gaz du patrimoine public",
      description:
        "Lorsque la collectivité dispose d'un schéma directeur immobilier énergétique, ou en engage un, l'inventaire s'y inscrit ; les économes de flux (ACTEE, etc.) peuvent accompagner son élaboration. L'inventaire porte sur le patrimoine de la collectivité et, pour un EPCI, sur celui de ses communes membres. Il s'agit de vérifier et de compléter les données déjà disponibles : pour le fioul, le recensement Prio-Fioul de la FNCCR, établi à partir des données PubliFioul d'EDF, donne déjà les sites concernés commune par commune ; IPPER et les déclarations OPERAT au titre du décret tertiaire complètent l'inventaire : présence d'une chaudière, consommations.",
    },
    sousActions: [],
    indicateurCodes: ['3.1.1-a', '3.1.1-b'],
    aides: [
      electrificationAides['OUT-005'],
      electrificationAides['OUT-009'],
      electrificationAides['OUT-006'],
      electrificationAides['DOC-004'],
      electrificationAides['PAR-006'],
      electrificationAides['OUT-004'],
      electrificationAides['OUT-016'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '3.1.2',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.1',
    champs: {
      titre:
        'Classer les bâtiments selon que le remplacement est possible directement ou nécessite une étude',
      description:
        "Deux catégories : remplacement direct possible ; étude nécessaire (couplage avec une rénovation ou situation complexe). Un premier tri peut se faire à distance (année de construction, questionnaire, photos). Appuis possibles : économe de flux (programme ACTEE), conseiller en énergie partagé là où ce service existe (syndicat d'énergie, agence locale de l'énergie).",
    },
    sousActions: [],
    indicateurCodes: ['3.1.2-a', '3.1.2-b'],
    aides: [
      electrificationAides['DSP-010'],
      electrificationAides['DSP-034'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '3.1.3',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.1',
    champs: {
      titre: 'Étudier le potentiel de la géothermie pour les bâtiments publics',
      description:
        "Lorsque le site s'y prête (emprise au sol disponible pour les forages ou les capteurs, accès des engins, contraintes techniques du bâtiment), la géothermie peut chauffer tous types de bâtiments de façon très efficace, avec la possibilité de les rafraîchir l'été. Il s'agit donc d'une solution à considérer systématiquement.",
    },
    sousActions: [],
    indicateurCodes: ['3.1.3-a', '3.1.3-b'],
    aides: [
      electrificationAides['DSP-025'],
      electrificationAides['PAR-031'],
      electrificationAides['DSP-058'],
    ],
  },
  {
    code: '3.1.4',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.1',
    champs: {
      titre:
        "Inscrire le remplacement des chaudières dans le plan pluriannuel d'investissement",
      description:
        "En s'appuyant si possible sur un schéma directeur immobilier et énergétique, et sur les guides d'I4CE pour un budget « aligné climat ». Suivre l'avancement par catégorie de bâtiment.",
    },
    sousActions: [],
    indicateurCodes: ['3.1.4-a', '3.1.4-b'],
    aides: [
      electrificationAides['OUT-004'],
      electrificationAides['DOC-004'],
      electrificationAides['DOC-008'],
      electrificationAides['PAR-003'],
      electrificationAides['PAR-006'],
    ],
  },
  {
    code: '3.2.1',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.2',
    champs: {
      titre:
        'Recenser les financements mobilisables et monter le plan de financement des remplacements',
      description:
        "Fonds vert, EduRénov, certificats d'économies d'énergie (Coup de pouce chauffage des bâtiments tertiaires), programme ACTEE, selon la capacité d'autofinancement de la collectivité. Pour les petites communes sans ingénierie, l'EPCI peut porter un groupement de commandes de marchés globaux de performance (MGP ou MGPEPD) : un seul marché pour plusieurs communes. Le tiers-financement (de type intracting, avec la Banque des Territoires) est une autre piste.",
    },
    sousActions: [],
    indicateurCodes: ['3.2.1-a', '3.2.1-b'],
    aides: [
      electrificationAides['DSP-026'],
      electrificationAides['DSP-009'],
      electrificationAides['DSP-010'],
      electrificationAides['DSP-025'],
      electrificationAides['DSP-027'],
      electrificationAides['DSP-029'],
      electrificationAides['DOC-005'],
      electrificationAides['DSP-051'],
      electrificationAides['DOC-004'],
      electrificationAides['PAR-003'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-002'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '3.2.2',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.2',
    champs: {
      titre:
        "Coopérer avec l'État, la Région, le Département et les autres gestionnaires publics présents sur le territoire",
      description:
        "Pour agir sur l'ensemble des bâtiments publics : collèges, lycées, cités administratives, hôpitaux, bâtiments des syndicats et des entreprises publiques locales. Partage des inventaires, calendrier commun, groupements de commandes.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-002']],
  },
  {
    code: '3.2.3',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.2',
    champs: {
      titre:
        "Former les agents à l'exploitation et à l'usage des nouveaux équipements",
      description:
        "Formation technique des agents chargés de l'exploitation et de la maintenance, et information des occupants sur le bon usage des installations.",
    },
    sousActions: [],
    indicateurCodes: ['3.2.3-a', '3.2.3-b'],
    aides: [],
  },
  {
    code: '3.2.4',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.2',
    champs: {
      titre: 'Suivre les résultats techniques et financiers des opérations',
      description:
        'Suivi interne : consommations avant et après travaux, coûts, économies réalisées.',
    },
    sousActions: [],
    indicateurCodes: ['3.2.4-a'],
    aides: [
      electrificationAides['OUT-009'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '3.3.1',
    validation: 'validated',
    axeNumero: 3,
    sousAxeNumero: '3.3',
    champs: {
      titre:
        'Valoriser auprès des habitants et des élus des autres communes les opérations réalisées et les économies obtenues',
      description:
        "Visites des installations dans les bâtiments du quotidien (école, gymnase, médiathèque), affichage des gains, retours d'expérience entre communes. Mettre en avant les économies de fonctionnement sur le budget énergie.",
    },
    sousActions: [],
    indicateurCodes: ['3.3.1-a'],
    aides: [],
  },
  {
    code: '4.1.1',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.1',
    champs: {
      titre:
        "S'approprier la méthodologie et les outils de cartographie du réseau de gaz",
      description:
        "Une méthodologie et des outils sont construits dans le cadre de la démarche 100 Territoires pour cartographier le réseau de gaz puis en classer les portions. La collectivité est invitée à participer au groupe de travail national qui les fait émerger et à se familiariser avec ces outils, en les utilisant pour cartographier le réseau de son territoire tel qu'il est aujourd'hui.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['OUT-006'],
      electrificationAides['DSP-052'],
      electrificationAides['DSP-001'],
      electrificationAides['DSP-027'],
      electrificationAides['PAR-010'],
      electrificationAides['PAR-011'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-005'],
    ],
  },
  {
    code: '4.1.2',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.1',
    champs: {
      titre:
        "Identifier avec le gestionnaire de réseau, par l'intermédiaire de l'autorité organisatrice, les zones où un réinvestissement est prévu dans les prochaines années",
      description:
        "Avec l'autorité organisatrice de la distribution de gaz, obtenir de GRDF ou de l'entreprise locale de distribution la programmation des réinvestissements des prochaines années, en particulier là où ils concernent un faible nombre de consommateurs (bouts de réseau, colonnes montantes, canalisations en fonte). Collecter les données nécessaires à l'analyse économique du réseau : coûts par secteur, investissements programmés, renouvellements anticipés, consommations par bâtiment. Un courrier type de l'autorité organisatrice au gestionnaire est fourni pour faciliter la démarche.",
    },
    sousActions: [
      {
        code: 'sous-action-024',
        champs: {
          titre:
            "Adresser la demande de données au gestionnaire de réseau, par l'autorité organisatrice",
        },
      },
      {
        code: 'sous-action-025',
        champs: {
          titre: 'Recevoir et analyser les données transmises',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['PAR-010'],
      electrificationAides['PAR-011'],
      electrificationAides['PAR-006'],
    ],
  },
  {
    code: '4.1.3',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.1',
    champs: {
      titre:
        'Identifier les systèmes de chauffage et les usages actuels du gaz sur le territoire',
      description:
        "Dresser l'état des lieux des usages du gaz en s'appuyant sur les outils de la démarche (fiche 4.1.1), qui croiseront les données disponibles : données locales de l'énergie, base de données nationale des bâtiments (via BatEnR), consommations transmises par le gestionnaire de réseau. Une partie de ces données est celle de la fiche 1.1.1. Les échanges avec les acteurs du territoire (bailleurs sociaux, espace conseil France Rénov', agence locale de l'énergie) les complètent. L'état des lieux porte sur les modes de chauffage, le nombre de consommateurs et les consommations par zone, les solutions de remplacement déjà présentes (réseau de chaleur, pompes à chaleur), les zones où il ne reste que peu de consommateurs, les contraintes à un changement de chauffage et les enjeux sociaux. Il recense aussi les points de livraison qui conditionnent l'évolution du réseau (sites industriels, chaufferies collectives, établissements sensibles) et les projets de décarbonation des industriels raccordés (voir la fiche 10.1.1).",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['OUT-006'],
      electrificationAides['OUT-012'],
      electrificationAides['PAR-005'],
      electrificationAides['PAR-010'],
      electrificationAides['PAR-011'],
      electrificationAides['PAR-030'],
    ],
  },
  {
    code: '4.2.1',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.2',
    champs: {
      titre:
        "Analyser l'évolution probable des modes de chauffage sur le territoire à moyen terme",
      description:
        "À partir de la cartographie du réseau (fiche 4.1.1) et de l'état des lieux des usages actuels du gaz (fiche 4.1.2), une réflexion prospective, quartier par quartier, sur l'évolution des systèmes de chauffage permet d'identifier les zones où une baisse durable de la consommation de gaz est la plus probable.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['OUT-006'],
      electrificationAides['PAR-005'],
      electrificationAides['PAR-006'],
    ],
  },
  {
    code: '4.2.2',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.2',
    champs: {
      titre:
        "Vérifier avec les gestionnaires des réseaux d'électricité et de chaleur qu'ils peuvent accueillir les usages éventuellement transférés",
      description:
        "La sortie du gaz sur une zone peut demander de renforcer le réseau électrique ou d'étendre un réseau de chaleur. Avec l'autorité organisatrice de la distribution d'électricité et les gestionnaires concernés (Enedis ou l'entreprise locale de distribution, exploitant du réseau de chaleur), vérifier que ces réseaux peuvent prendre le relais, et à quel horizon.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['PAR-008'],
      electrificationAides['PAR-011'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-015'],
      electrificationAides['PAR-016'],
    ],
  },
  {
    code: '4.2.3',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.2',
    champs: {
      titre:
        "Analyser, dans les zones pré-identifiées, la situation des usagers et leurs besoins d'accompagnement",
      description:
        "Dans les zones où une baisse de la consommation de gaz est probable, analyser les effets pour les usagers : coût d'un changement de chauffage avant la fin de vie de la chaudière, économies attendues sur la facture, intérêt d'un réseau de chaleur ou d'une pompe à chaleur, occasions de sortie progressive (opérations d'aménagement, rénovations, équipements arrivant en fin de vie). Caractériser la situation des usagers (usage du gaz, solution de remplacement possible, capacité financière) et estimer leurs besoins d'accompagnement. Ces éléments nourrissent la concertation et le choix des zones.",
    },
    sousActions: [],
    indicateurCodes: ['4.2.3-a'],
    aides: [
      electrificationAides['DSP-005'],
      electrificationAides['DSP-036'],
      electrificationAides['PAR-010'],
      electrificationAides['PAR-001'],
    ],
  },
  {
    code: '4.2.4',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.2',
    champs: {
      titre:
        "Conduire la concertation locale sur les zones pré-identifiées et en tirer des scénarios à l'échelle du territoire",
      description:
        "Analyse qualitative des zones pré-identifiées avec les élus, les habitants et les principaux propriétaires (bailleurs sociaux, copropriétés), puis élaboration de scénarios à l'échelle du territoire, débattus localement.",
    },
    sousActions: [
      {
        code: 'sous-action-026',
        champs: {
          titre: 'Conduire la concertation sur les zones pré-identifiées',
        },
      },
      {
        code: 'sous-action-027',
        champs: {
          titre: "Élaborer les scénarios à l'échelle du territoire",
        },
      },
    ],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-006'], electrificationAides['PAR-012']],
  },
  {
    code: '4.3.1',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.3',
    champs: {
      titre:
        "Identifier les zones où un réinvestissement dans le réseau de gaz n'est pas nécessaire",
      description:
        "Une fois les usages futurs scénarisés (sous-axe 4.2) et les réinvestissements prévus connus (fiche 4.1.3), classer les portions du réseau selon la méthodologie nationale, à la maille qu'elle précise (rue, quartier) : là où la consommation de gaz est appelée à baisser durablement, un réinvestissement peut ne plus être pertinent. Ce travail se mène avec l'autorité organisatrice de la distribution de gaz et le gestionnaire de réseau, avec qui il s'agit de convenir de limiter les investissements sur ces portions, pour éviter les coûts échoués.",
    },
    sousActions: [
      {
        code: 'sous-action-028',
        champs: {
          titre:
            'Classer les portions du réseau selon la méthodologie nationale',
        },
      },
      {
        code: 'sous-action-029',
        champs: {
          titre:
            "Croiser les réinvestissements prévus avec les scénarios d'évolution des usages",
        },
      },
      {
        code: 'sous-action-030',
        champs: {
          titre:
            "Convenir avec le gestionnaire d'une logique d'investissements sans regret",
        },
      },
    ],
    indicateurCodes: ['4.3.1-a'],
    aides: [
      electrificationAides['DSP-052'],
      electrificationAides['PAR-010'],
      electrificationAides['PAR-011'],
      electrificationAides['PAR-006'],
    ],
  },
  {
    code: '4.3.2',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.3',
    champs: {
      titre:
        'Faire adopter par délibération le scénario retenu et les zones concernées',
      description:
        "Le scénario issu de la concertation, avec les zones où les usagers seront incités à changer de mode de chauffage et les réinvestissements que l'on convient d'éviter, est arrêté par délibération.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-006']],
  },
  {
    code: '4.3.3',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.3',
    champs: {
      titre:
        "Délimiter d'éventuelles zones déconseillées de raccordement au gaz et inscrire la trajectoire dans les documents de planification locaux",
      description:
        "PCAET, PLU(i), schéma directeur des énergies, dans les limites prévues par la loi. Cette inscription donne de la visibilité aux habitants et évite qu'un raccordement neuf soit réalisé sur une portion appelée à être moins utilisée.",
    },
    sousActions: [
      {
        code: 'sous-action-031',
        champs: {
          titre:
            "Délimiter d'éventuelles zones déconseillées de raccordement au gaz",
        },
      },
      {
        code: 'sous-action-032',
        champs: {
          titre:
            'Inscrire la trajectoire dans les documents de planification locaux',
        },
      },
    ],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-006']],
  },
  {
    code: '4.3.4',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.3',
    champs: {
      titre:
        "Prendre en compte, avec l'autorité organisatrice, la trajectoire du réseau dans le contrat de concession",
      description:
        "Sur les zones où une limitation à terme des investissements a été convenue avec le gestionnaire de réseau, l'autorité organisatrice de la distribution de gaz intègre cette vision de long terme dans le suivi de la concession et, lors de sa prochaine révision, dans le contrat, selon le cadre national en vigueur.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['PAR-006'],
      electrificationAides['PAR-010'],
      electrificationAides['PAR-011'],
    ],
  },
  {
    code: '4.4.1',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.4',
    champs: {
      titre:
        'Mener des actions ciblées pour accélérer la sortie du gaz dans les zones identifiées',
      description:
        "Opérations groupées de changement de chauffage, en mobilisant les aides disponibles : offres intégrées de pompes à chaleur, primes CEE pour une pompe à chaleur ou un raccordement à un réseau de chaleur, MaPrimeRénov' pour une rénovation d'ampleur. Pour les logements où le gaz ne sert plus qu'à la cuisson ou à l'eau chaude, opération « zéro abonnement » : plaques à induction, ballon d'eau chaude, accompagnement à la résiliation de l'abonnement.",
    },
    sousActions: [
      {
        code: 'sous-action-033',
        champs: {
          titre: 'Organiser des opérations groupées de changement de chauffage',
        },
      },
      {
        code: 'sous-action-034',
        champs: {
          titre: "Mobiliser les aides du plan d'électrification",
        },
      },
      {
        code: 'sous-action-035',
        champs: {
          titre: 'Étudier une opération « zéro abonnement »',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['PAR-001'],
      electrificationAides['PAR-010'],
      electrificationAides['DSP-007'],
      electrificationAides['DSP-036'],
      electrificationAides['DSP-005'],
      electrificationAides['DSP-050'],
      electrificationAides['PAR-031'],
      electrificationAides['DSP-060'],
    ],
  },
  {
    code: '4.4.2',
    validation: 'validated',
    axeNumero: 4,
    sousAxeNumero: '4.4',
    champs: {
      titre:
        'Coordonner le calendrier des secteurs concernés avec les travaux de voirie et des autres réseaux',
      description:
        "Croiser la carte des secteurs concernés avec la programmation des travaux de voirie et des autres réseaux (assainissement, éclairage public, renforcement éventuel du réseau électrique) : l'ouverture d'une rue est l'occasion d'organiser les changements de chauffage en amont du chantier. Par l'intermédiaire de l'autorité organisatrice, obtenir du gestionnaire de réseau de gaz le calendrier des travaux de mise en sécurité des portions qui ne sont plus utilisées (purge, débranchement, condamnation), qui lui incombent, et le faire coïncider avec ces chantiers.",
    },
    sousActions: [
      {
        code: 'sous-action-036',
        champs: {
          titre:
            'Intégrer le calendrier des secteurs concernés dans la programmation de voirie',
        },
      },
      {
        code: 'sous-action-037',
        champs: {
          titre:
            'Obtenir du gestionnaire de réseau la programmation des travaux de mise en sécurité',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['PAR-010'],
      electrificationAides['PAR-011'],
      electrificationAides['PAR-006'],
    ],
  },
  {
    code: '5.1.1',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.1',
    champs: {
      titre:
        "S'approprier les données de parc, d'immatriculations et les enquêtes de déplacements",
      description:
        "La collectivité s'approprie les données sur le parc de véhicules et les immatriculations de son territoire, comparées aux moyennes nationales, que l'État met à sa disposition avec un kit de diagnostic. Elle les complète et les précise avec ce qu'elle sait du territoire et, quand elles existent, avec les enquêtes de déplacements réalisées par l'autorité organisatrice de la mobilité ou par les grands employeurs.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['OUT-002'], electrificationAides['PAR-005']],
  },
  {
    code: '5.2.1',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.2',
    champs: {
      titre:
        'Informer les habitants et leur faire essayer des véhicules électriques',
      description:
        "Réunions publiques, présence dans les bureaux de poste et les espaces France Services, salon ou journée d'essais, essais de plusieurs jours avec les concessionnaires ou des flottes professionnelles. S'appuyer sur les associations d'usagers de la mobilité électrique (membres de l'Avere, FFAUVE, Shifters…). Présenter aussi l'offre de véhicules d'occasion et les véhicules légers intermédiaires.",
    },
    sousActions: [
      {
        code: 'sous-action-038',
        champs: {
          titre: "Organiser des réunions publiques d'information",
        },
      },
      {
        code: 'sous-action-039',
        champs: {
          titre: "Organiser une journée ou un salon d'essais",
        },
      },
      {
        code: 'sous-action-040',
        champs: {
          titre:
            'Proposer des essais de plusieurs jours avec les concessionnaires ou des flottes professionnelles',
        },
      },
    ],
    indicateurCodes: ['5.2.1-a', '5.2.1-b'],
    aides: [
      electrificationAides['DSP-049'],
      electrificationAides['DSP-003'],
      electrificationAides['DSP-028'],
      electrificationAides['PAR-021'],
      electrificationAides['PAR-020'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '5.2.2',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.2',
    champs: {
      titre:
        'Accorder des avantages de stationnement et de circulation aux véhicules électriques',
      description:
        "Tarifs ou abonnements préférentiels, places réservées (par exemple aux abords des écoles), éventuellement modulés selon le poids du véhicule. Dans les territoires où les véhicules électriques sont encore peu nombreux, l'ouverture temporaire de certaines voies réservées aux transports collectifs peut être envisagée.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [],
  },
  {
    code: '5.2.3',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.2',
    champs: {
      titre:
        'Mettre à disposition des voitures et des vélos électriques partagés',
      description:
        "Autopartage de voitures électriques et vélos à assistance électrique, avec l'autorité organisatrice de la mobilité lorsqu'elle existe.",
    },
    sousActions: [],
    indicateurCodes: ['5.2.3-a'],
    aides: [
      electrificationAides['DOC-002'],
      electrificationAides['DSP-023'],
      electrificationAides['DSP-022'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '5.3.1',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.3',
    champs: {
      titre: 'Accompagner les ménages éligibles vers le leasing social',
      description:
        'Information et aide aux démarches, avec les espaces France Services, les conseillers mobilité et les concessionnaires du territoire.',
    },
    sousActions: [],
    indicateurCodes: ['5.3.1-a'],
    aides: [
      electrificationAides['DSP-003'],
      electrificationAides['DSP-049'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '5.3.2',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.3',
    champs: {
      titre: "Faciliter l'installation de bornes de recharge à domicile",
      description:
        "Publier la liste des installateurs qualifiés du territoire ; si la demande le justifie, organiser un achat groupé à prix négocié. En copropriété, accompagner l'exercice du droit à la prise et suivre les délais de mise en œuvre.",
    },
    sousActions: [
      {
        code: 'sous-action-041',
        champs: {
          titre: 'Publier la liste des installateurs qualifiés',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-021'],
      electrificationAides['DSP-031'],
      electrificationAides['PAR-021'],
      electrificationAides['PAR-023'],
      electrificationAides['DSP-059'],
    ],
  },
  {
    code: '5.3.3',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.3',
    champs: {
      titre:
        "Mobiliser les garages et les accompagner dans l'évolution de leur métier",
      description:
        "Lorsqu'un véhicule ancien tombe en panne ou échoue au contrôle technique, le garagiste peut présenter l'option électrique (coût d'usage, aides, recharge) et orienter vers le bon interlocuteur. La collectivité accompagne aussi la profession dans l'évolution de son métier : formation à l'entretien des véhicules électriques, garages solidaires, véhicules de prêt électriques.",
    },
    sousActions: [],
    indicateurCodes: ['5.3.3-a', '5.3.3-b'],
    aides: [electrificationAides['PAR-026']],
  },
  {
    code: '5.4.1',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.4',
    champs: {
      titre:
        "S'engager à acheter des véhicules électriques à chaque renouvellement, sauf exception justifiée",
      description:
        "Engagement de principe pour les achats et locations de la collectivité, à l'exemple des règles que l'État s'applique par circulaire pour sa propre flotte. Les exceptions, pour des usages sans offre électrique adaptée, sont motivées.",
    },
    sousActions: [],
    indicateurCodes: ['5.4.1-a'],
    aides: [electrificationAides['OUT-001']],
  },
  {
    code: '5.4.2',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.4',
    champs: {
      titre:
        "Établir le plan d'investissement et de financement de la flotte électrique",
      description:
        "Adossé au registre des échéances de renouvellement (véhicules en propre, délégations de service public, transport scolaire, prestations). Anticiper l'installation des bornes et les délais de raccordement, et identifier les financements mobilisables.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['OUT-001'],
      electrificationAides['DSP-022'],
      electrificationAides['DSP-047'],
      electrificationAides['PAR-021'],
    ],
  },
  {
    code: '5.5.1',
    validation: 'validated',
    axeNumero: 5,
    sousAxeNumero: '5.5',
    champs: {
      titre:
        "Signer une charte avec les employeurs du territoire pour l'électrification de leurs flottes",
      description:
        "Engagements sur les véhicules de fonction et de service, l'équipement des parkings, le crédit mobilité, en s'appuyant sur les plans de mobilité employeur existants et, lorsqu'elle existe, sur l'autorité organisatrice de la mobilité. La démarche peut associer les concessionnaires et un réseau d'entreprises, et s'appuyer sur un événement chez un employeur déjà avancé. Elle convient surtout aux EPCI qui comptent suffisamment de grands employeurs.",
    },
    sousActions: [],
    indicateurCodes: ['5.5.1-a', '5.5.1-b'],
    aides: [
      electrificationAides['OUT-001'],
      electrificationAides['DSP-021'],
      electrificationAides['PAR-024'],
      electrificationAides['PAR-025'],
      electrificationAides['PAR-021'],
    ],
  },
  {
    code: '6.1.1',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.1',
    champs: {
      titre:
        "Faire l'inventaire des bornes existantes et établir les besoins non pourvus",
      description:
        "L'inventaire décrit les bornes existantes et celles déjà en projet : puissance, accès public ou privé, fiabilité, opérateur. Un diagnostic des besoins en recharge rapide, notamment sur les lieux de passage, et en recharge lente est établi avec les opérateurs. Les zones blanches s'en déduisent (ex : secteurs ruraux peu denses, copropriétés peu équipées, quartiers où les places de stationnement sont rares au regard du nombre de véhicules).",
    },
    sousActions: [
      {
        code: 'sous-action-042',
        champs: {
          titre: "Faire l'inventaire des bornes existantes et en projet",
        },
      },
      {
        code: 'sous-action-043',
        champs: {
          titre: 'Établir le diagnostic des besoins avec les opérateurs',
        },
      },
      {
        code: 'sous-action-044',
        champs: {
          titre: 'Identifier les zones blanches',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['OUT-003'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-008'],
      electrificationAides['PAR-022'],
    ],
  },
  {
    code: '6.1.2',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.1',
    champs: {
      titre:
        "Publier une liste de sites publics préqualifiés pour l'installation de bornes",
      description:
        "Pour chaque site : surface, estimation du raccordement, redevance, modèle d'autorisation d'occupation. Consulter les opérateurs par lots associant un site rentable et une zone blanche. Ce travail peut être mené en même temps que la recherche de sites pour les poids lourds.",
    },
    sousActions: [
      {
        code: 'sous-action-045',
        champs: {
          titre:
            'Préqualifier les sites publics (surface, raccordement, redevance)',
        },
      },
      {
        code: 'sous-action-046',
        champs: {
          titre: 'Publier la liste des sites',
        },
      },
      {
        code: 'sous-action-047',
        champs: {
          titre: 'Consulter les opérateurs par lots',
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['PAR-006'],
      electrificationAides['PAR-008'],
      electrificationAides['PAR-022'],
    ],
  },
  {
    code: '6.1.3',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.1',
    champs: {
      titre:
        'Organiser et animer un point régulier avec Enedis et les opérateurs sur les délais de raccordement',
      description:
        "Point trimestriel entre la collectivité, le syndicat d'énergie et Enedis sur les dossiers en attente, en distinguant bornes publiques, bornes à domicile et bornes en copropriété.",
    },
    sousActions: [],
    indicateurCodes: ['6.1.3-a'],
    aides: [electrificationAides['PAR-008'], electrificationAides['PAR-006']],
  },
  {
    code: '6.1.4',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.1',
    champs: {
      titre: "Publier l'état du réseau local de bornes",
      description:
        "Taux d'utilisation, prix, disponibilité, état de fonctionnement. Ces informations aident les opérateurs à décider de nouveaux investissements.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['OUT-003'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-022'],
    ],
  },
  {
    code: '6.2.1',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.2',
    champs: {
      titre: 'Équiper les lieux de passage en bornes rapides',
      description:
        "Gares, parkings publics, aires de covoiturage, abords des grands axes : les lieux de passage accueillent en priorité la recharge rapide. Si un manque est constaté, examiner avec les opérateurs les freins (foncier, raccordement, voirie) et la possibilité de partager les bornes de forte puissance avec les véhicules utilitaires, les bus et les poids lourds. Là où les opérateurs ne s'y engagent pas, la collectivité peut financer elle-même ces bornes, avec le programme Advenir.",
    },
    sousActions: [],
    indicateurCodes: ['6.2.1-a'],
    aides: [
      electrificationAides['OUT-003'],
      electrificationAides['DSP-021'],
      electrificationAides['PAR-022'],
      electrificationAides['PAR-008'],
      electrificationAides['PAR-006'],
    ],
  },
  {
    code: '6.3.1',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.3',
    champs: {
      titre:
        'Financer des bornes publiques dans les zones blanches, là où les opérateurs ne vont pas',
      description:
        'Mobiliser le programme Advenir et le Fonds vert. Attribuer le foncier par lots couvrant aussi les zones blanches. Adapter le type de borne aux usages : recharge rapide sur les aires de covoiturage, recharge de nuit dans les quartiers résidentiels.',
    },
    sousActions: [],
    indicateurCodes: ['6.3.1-a'],
    aides: [
      electrificationAides['DSP-021'],
      electrificationAides['DSP-023'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-022'],
    ],
  },
  {
    code: '6.3.2',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.3',
    champs: {
      titre:
        "Conventionner avec les entreprises pour accélérer l'équipement de leurs parkings, voire les ouvrir au public",
      description:
        "En particulier dans les zones d'activités éloignées du réseau public.",
    },
    sousActions: [],
    indicateurCodes: ['6.3.2-a'],
    aides: [electrificationAides['DSP-021'], electrificationAides['PAR-025']],
  },
  {
    code: '6.3.3',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.3',
    champs: {
      titre:
        "Prévoir l'équipement en bornes dans les conventions avec les bailleurs sociaux",
      description:
        "Optimiser les capacités de recharge des parkings des résidences, avec le programme Advenir ; vérifier les obligations qui s'appliquent aux bailleurs publics.",
    },
    sousActions: [],
    indicateurCodes: ['6.3.3-a', '6.3.3-b'],
    aides: [electrificationAides['DSP-021'], electrificationAides['PAR-012']],
  },
  {
    code: '6.3.4',
    validation: 'validated',
    axeNumero: 6,
    sousAxeNumero: '6.3',
    champs: {
      titre: "Faciliter l'équipement des parkings de copropriété",
      description:
        'Information des copropriétaires et des syndics, médiation en cas de blocage, suivi des raccordements avec Enedis ; le cas échéant, appui technique ou financier.',
    },
    sousActions: [],
    indicateurCodes: ['6.3.4-a', '6.3.4-b'],
    aides: [
      electrificationAides['DSP-021'],
      electrificationAides['DSP-031'],
      electrificationAides['PAR-008'],
      electrificationAides['PAR-021'],
      electrificationAides['PAR-023'],
    ],
  },
  {
    code: '7.1.1',
    validation: 'validated',
    axeNumero: 7,
    sousAxeNumero: '7.1',
    champs: {
      titre:
        'Caractériser les flux de poids lourds et les besoins de recharge avec les transporteurs du territoire',
      description:
        "Dialogue avec les transporteurs et les chargeurs : flux de passage, logistique locale, haltes de nuit ; projets d'électrification à trois ans ; engagements d'usage sous forme de lettres d'intention.",
    },
    sousActions: [],
    indicateurCodes: ['7.1.1-a'],
    aides: [electrificationAides['DSP-030']],
  },
  {
    code: '7.1.2',
    validation: 'validated',
    axeNumero: 7,
    sousAxeNumero: '7.1',
    champs: {
      titre:
        'Estimer le besoin de recharge des poids lourds et la surface foncière nécessaire',
      description:
        "Recharge d'appoint, recharge rapide en itinérance, recharge de nuit, en tenant compte des stations existantes à proximité. En déduire l'emprise foncière à mobiliser.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-008'], electrificationAides['PAR-009']],
  },
  {
    code: '7.2.1',
    validation: 'validated',
    axeNumero: 7,
    sousAxeNumero: '7.2',
    champs: {
      titre:
        'Analyser le foncier disponible, classer les sites possibles et constituer le dossier du (des) site(s) retenu(s)',
      description:
        "Critères : compatibilité avec le PLU(i) et le SCoT, objectif de zéro artificialisation nette, possibilités d'extension et de raccordement, proximité des grands axes, place dans le maillage régional, conflits d'usage, effets sur l'environnement et le paysage. Le dossier vise un site prêt à être proposé aux opérateurs : maîtrise foncière ou promesse, pré-étude de raccordement, compatibilité d'urbanisme, étude environnementale de cadrage.",
    },
    sousActions: [
      {
        code: 'sous-action-048',
        champs: {
          titre: 'Analyser le foncier disponible',
        },
      },
      {
        code: 'sous-action-049',
        champs: {
          titre: 'Classer les sites possibles',
        },
      },
      {
        code: 'sous-action-050',
        champs: {
          titre: 'Constituer le dossier du ou des sites retenus',
        },
      },
    ],
    indicateurCodes: ['7.2.1-a'],
    aides: [
      electrificationAides['DSP-001'],
      electrificationAides['DSP-027'],
      electrificationAides['PAR-008'],
      electrificationAides['PAR-009'],
    ],
  },
  {
    code: '7.2.2',
    validation: 'validated',
    axeNumero: 7,
    sousAxeNumero: '7.2',
    champs: {
      titre: 'Sécuriser la maîtrise foncière du ou des sites retenus',
      description:
        "Par l'établissement public foncier ou une foncière locale, avec option d'achat ou bail à construction.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [],
  },
  {
    code: '7.2.3',
    validation: 'validated',
    axeNumero: 7,
    sousAxeNumero: '7.2',
    champs: {
      titre: 'Mettre le ou les sites à disposition des opérateurs',
      description:
        "Une fois le site sécurisé, le proposer aux opérateurs de recharge par un appel à projets, un appel à manifestation d'intérêt ou une autre procédure de mise en concurrence, en précisant les conditions d'occupation : redevance, durée, obligations de service.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-022']],
  },
  {
    code: '7.3.1',
    validation: 'validated',
    axeNumero: 7,
    sousAxeNumero: '7.3',
    champs: {
      titre: 'Prévoir les services attendus sur le site',
      description:
        'Ouverture 24 h/24, sécurité et éclairage, sanitaires et services aux conducteurs pour les recharges longues, système de réservation.',
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [],
  },
  {
    code: '8.1.1',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.1',
    champs: {
      titre: "Recenser le parc d'autobus et caractériser les lignes",
      description:
        "Parc : type de service (urbain, scolaire, interurbain, transport à la demande), propriétaire (collectivité, loueur, transporteur), motorisation, ancienneté, kilométrage. Lignes : longueur, fréquence, taux d'occupation, retours au dépôt.",
    },
    sousActions: [
      {
        code: 'sous-action-051',
        champs: {
          titre: "Recenser le parc d'autobus",
        },
      },
      {
        code: 'sous-action-052',
        champs: {
          titre: 'Caractériser les lignes',
        },
      },
    ],
    indicateurCodes: [],
    aides: [],
  },
  {
    code: '8.1.2',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.1',
    champs: {
      titre: 'Tenir un registre des échéances des contrats de transport',
      description:
        "Recenser sur dix ans les échéances (délégations de service public, marchés de transport scolaire, prestations) et préparer, environ dix-huit mois avant chacune, les clauses d'électrification : part de véhicules électriques, propriété des bornes de dépôt en fin de contrat.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [],
  },
  {
    code: '8.2.1',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.2',
    champs: {
      titre:
        'Élaborer une feuille de route de renouvellement des lignes prioritaires',
      description:
        "Élaborée avec les exploitants. Lignes prioritaires : fréquence régulière, kilométrage quotidien important, enjeu de qualité de l'air, accès à la recharge. Renouvellement selon l'ancienneté, le kilométrage, la durée d'amortissement et les échéances des contrats.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['DSP-047']],
  },
  {
    code: '8.2.2',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.2',
    champs: {
      titre:
        "Évaluer l'intérêt du rétrofit pour les autobus et autocars récents",
      description:
        "Pour les véhicules récents, comparer le rétrofit (passage à une motorisation électrique) avec l'achat d'un véhicule neuf. Vérifier les financements mobilisables, notamment par les certificats d'économies d'énergie.",
    },
    sousActions: [],
    indicateurCodes: ['8.2.2-a'],
    aides: [electrificationAides['DSP-020']],
  },
  {
    code: '8.2.3',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.2',
    champs: {
      titre: 'Identifier les financements du renouvellement',
      description:
        'Marché mutualisé entre autorités organisatrices, CEE, Banque des Territoires, tiers-financement ou location des batteries.',
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-020'],
      electrificationAides['DSP-022'],
      electrificationAides['DSP-029'],
      electrificationAides['PAR-003'],
    ],
  },
  {
    code: '8.2.4',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.2',
    champs: {
      titre:
        'Conventionner avec la Région pour électrifier le transport scolaire et interurbain',
      description:
        "Entre l'autorité organisatrice de la mobilité et la Région, pour les services que celle-ci organise sur le territoire.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-029']],
  },
  {
    code: '8.2.5',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.2',
    champs: {
      titre: 'Organiser le devenir des autobus thermiques remplacés',
      description:
        'Réaffectation sur des lignes moins fréquentées, cession ou don à des associations pour des usages ponctuels.',
    },
    sousActions: [],
    indicateurCodes: ['8.2.5-a'],
    aides: [],
  },
  {
    code: '8.3.1',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.3',
    champs: {
      titre:
        'Équiper les dépôts en bornes de recharge, en anticipant leur raccordement avec Enedis',
      description:
        "Repérer le potentiel des dépôts, parkings de nuit, gares routières et terminus. Déposer les demandes de puissance auprès d'Enedis dès que les dépôts sont choisis, sans attendre la commande des bus. Tenir compte des règles de sécurité, notamment incendie, et des documents d'urbanisme.",
    },
    sousActions: [],
    indicateurCodes: ['8.3.1-a', '8.3.1-b'],
    aides: [electrificationAides['PAR-008']],
  },
  {
    code: '8.3.2',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.3',
    champs: {
      titre:
        'Équiper les lignes prioritaires en bornes de recharge intermédiaires',
      description:
        "Recharge rapide en ligne ou en terminus lorsque l'autonomie l'exige, en anticipant le raccordement.",
    },
    sousActions: [],
    indicateurCodes: ['8.3.2-a'],
    aides: [electrificationAides['PAR-008']],
  },
  {
    code: '8.3.3',
    validation: 'validated',
    axeNumero: 8,
    sousAxeNumero: '8.3',
    champs: {
      titre:
        "Prévoir dans les contrats d'exploitation la formation des conducteurs et des équipes de maintenance",
      description:
        "Le contrat d'exploitation est le moyen pour l'autorité organisatrice de garantir cette formation.",
    },
    sousActions: [],
    indicateurCodes: ['8.3.3-a'],
    aides: [],
  },
  {
    code: '9.1.1',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.1',
    champs: {
      titre:
        "Recenser les entreprises artisanales des métiers les plus concernés par l'électrification",
      description:
        'Boulangers-pâtissiers, bouchers-charcutiers-traiteurs, carrossiers, pressings, menuisiers, garagistes…',
    },
    sousActions: [],
    indicateurCodes: ['9.1.1-a'],
    aides: [electrificationAides['PAR-026'], electrificationAides['PAR-025']],
  },
  {
    code: '9.1.2',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.1',
    champs: {
      titre:
        'Enquêter auprès des artisans repérés et choisir les cibles à accompagner',
      description:
        "Enquête menée avec la CMA et les fédérations. Elle porte sur les sources d'énergie et les consommations, les équipements à remplacer, le poids de l'énergie dans les charges de l'entreprise. Elle permet de retenir les artisans à accompagner individuellement et, le cas échéant, une filière emblématique du territoire à accompagner collectivement.",
    },
    sousActions: [
      {
        code: 'sous-action-053',
        champs: {
          titre: "Mener l'enquête avec la CMA et les fédérations",
        },
      },
      {
        code: 'sous-action-054',
        champs: {
          titre:
            'Choisir les artisans et, le cas échéant, la filière à accompagner',
        },
      },
    ],
    indicateurCodes: ['9.1.2-a'],
    aides: [electrificationAides['PAR-026']],
  },
  {
    code: '9.2.1',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.2',
    champs: {
      titre:
        "Animer un collectif d'artisans et leur proposer un parcours d'accompagnement",
      description:
        "Visites de sites témoins, réunions à des horaires compatibles avec l'activité. Le programme Mon Parcours Économie d'Énergie (MPEE) sert de porte d'entrée : visite énergie, montage des dossiers d'aide (DecarbFlash, prêts Bpifrance…). Relais : les structures qui accueillent un conseiller MPEE (CCI, CMA, agences locales de l'énergie, associations locales).",
    },
    sousActions: [],
    indicateurCodes: ['9.2.1-a'],
    aides: [
      electrificationAides['DSP-015'],
      electrificationAides['DSP-045'],
      electrificationAides['DSP-044'],
      electrificationAides['DSP-037'],
      electrificationAides['DSP-019'],
      electrificationAides['PAR-026'],
      electrificationAides['PAR-025'],
      electrificationAides['PAR-004'],
      electrificationAides['PAR-007'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '9.2.2',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.2',
    champs: {
      titre: "Organiser des commandes groupées d'équipements",
      description:
        "Regrouper les achats d'un même type d'équipement pour négocier les prix, lorsque le nombre d'entreprises intéressées le permet.",
    },
    sousActions: [],
    indicateurCodes: ['9.2.2-a'],
    aides: [
      electrificationAides['DSP-037'],
      electrificationAides['PAR-026'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '9.2.3',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.2',
    champs: {
      titre:
        "Conditionner les aides de la collectivité aux entreprises à la réalisation d'une visite énergie",
      description:
        "Visite énergie du programme Mon Parcours Économie d'Énergie (MPEE) ou tenue d'un carnet de bord de l'entreprise.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-045'],
      electrificationAides['DSP-015'],
      electrificationAides['PAR-026'],
      electrificationAides['PAR-025'],
      electrificationAides['PAR-007'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '9.2.4',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.2',
    champs: {
      titre:
        "Intégrer des clauses d'électrification dans les marchés publics et les délégations de service public de la collectivité",
      description:
        'Par exemple : chantiers et engins raccordés au réseau électrique, équipements de cuisson de la restauration collective, crématorium, marchés forains.',
    },
    sousActions: [],
    indicateurCodes: ['9.2.4-a'],
    aides: [electrificationAides['DSP-040'], electrificationAides['PAR-031']],
  },
  {
    code: '9.3.1',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.3',
    champs: {
      titre:
        'Organiser le raccordement groupé et le renforcement du réseau dans les zones artisanales',
      description:
        "Regrouper les demandes des artisans d'une même zone qui ont besoin de plus de puissance, et étudier avec Enedis le renforcement nécessaire.",
    },
    sousActions: [],
    indicateurCodes: ['9.3.1-a'],
    aides: [electrificationAides['PAR-008']],
  },
  {
    code: '9.4.1',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.4',
    champs: {
      titre:
        "Intégrer l'électrification dans l'accompagnement des cessions et reprises d'entreprises",
      description:
        'Avec la CMA, prévoir un volet électrification dans les dossiers de transmission : diagnostic proposé au repreneur, aides intégrées au plan de financement.',
    },
    sousActions: [
      {
        code: 'sous-action-055',
        champs: {
          titre: "Conventionner avec la chambre de métiers et de l'artisanat",
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-015'],
      electrificationAides['PAR-026'],
      electrificationAides['PAR-025'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '9.4.2',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.4',
    champs: {
      titre: 'Mobiliser et former les conseillers habituels des artisans',
      description:
        "L'artisan décide souvent avec son expert-comptable et sa banque, et se fait conseiller par son fournisseur de matériel. Réunir ces réseaux, les informer des solutions électriques et des aides disponibles, et convenir avec eux de présenter systématiquement l'option électrique.",
    },
    sousActions: [
      {
        code: 'sous-action-056',
        champs: {
          titre:
            'Conventionner avec au moins un réseau de conseillers des artisans',
        },
      },
    ],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-026'], electrificationAides['PAR-025']],
  },
  {
    code: '9.4.3',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.4',
    champs: {
      titre:
        "Proposer des solutions pour limiter l'arrêt d'activité pendant les travaux d'électrification",
      description:
        "Pistes : matériel de prêt mutualisé, avance de trésorerie ou prêt à taux zéro couvrant la période d'arrêt.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['DSP-019'], electrificationAides['PAR-026']],
  },
  {
    code: '9.5.1',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.5',
    champs: {
      titre: "Repérer les locaux d'activité chauffés au fioul ou au gaz",
      description:
        'À partir des données rassemblées pour les bâtiments privés et des déclarations OPERAT au titre du décret tertiaire.',
    },
    sousActions: [],
    indicateurCodes: ['9.5.1-a'],
    aides: [
      electrificationAides['OUT-009'],
      electrificationAides['OUT-006'],
      electrificationAides['PAR-025'],
      electrificationAides['PAR-026'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '9.5.2',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.5',
    champs: {
      titre:
        'Orienter les artisans et les commerçants vers la visite énergie et les aides au remplacement du chauffage',
      description:
        "La visite énergie du programme Mon Parcours Économie d'Énergie (MPEE) couvre aussi le chauffage des locaux ; les CEE aident à l'installation de pompes à chaleur.",
    },
    sousActions: [],
    indicateurCodes: ['9.5.2-a', '9.5.2-b'],
    aides: [
      electrificationAides['DSP-045'],
      electrificationAides['DSP-015'],
      electrificationAides['PAR-025'],
      electrificationAides['PAR-026'],
      electrificationAides['PAR-007'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '9.5.3',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.5',
    champs: {
      titre:
        "Proposer une clause type « local prêt pour l'électrification » dans les baux commerciaux",
      description:
        "Clarifier le partage entre bailleur et preneur du coût du renforcement électrique du local. La collectivité peut l'appliquer à ses propres locaux commerciaux et la diffuser auprès des gestionnaires de locaux.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-025']],
  },
  {
    code: '9.6.1',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.6',
    champs: {
      titre:
        "Informer les artisans sur le coût d'usage des utilitaires électriques et les aides disponibles",
      description:
        'Avec la CMA : comparaison du coût total sur la durée de détention, aides mobilisables. Pour les engins de chantier, programme E-Trans.',
    },
    sousActions: [],
    indicateurCodes: ['9.6-a', '9.6.1-a'],
    aides: [
      electrificationAides['DSP-032'],
      electrificationAides['DSP-040'],
      electrificationAides['PAR-026'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '9.6.2',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.6',
    champs: {
      titre:
        "Organiser des essais d'utilitaires électriques avec les concessionnaires et les loueurs",
      description:
        "Prêts de plusieurs jours, en conditions réelles d'activité.",
    },
    sousActions: [],
    indicateurCodes: ['9.6-a', '9.6.2-a'],
    aides: [electrificationAides['PAR-026'], electrificationAides['PAR-021']],
  },
  {
    code: '9.6.3',
    validation: 'validated',
    axeNumero: 9,
    sousAxeNumero: '9.6',
    champs: {
      titre:
        "Faciliter la recharge des utilitaires au local, en zone d'activités et sur le réseau public",
      description:
        "En lien avec les actions de l'engagement sur les bornes de recharge.",
    },
    sousActions: [],
    indicateurCodes: ['9.6-a', '9.6.3-a'],
    aides: [electrificationAides['DSP-021'], electrificationAides['PAR-008']],
  },
  {
    code: '10.1.1',
    validation: 'validated',
    axeNumero: 10,
    sousAxeNumero: '10.1',
    champs: {
      titre:
        'Identifier les industriels mobilisés, leurs projets et leurs équipements en fin de vie',
      description:
        "Démarche menée avec l'ADEME, la DREAL, la DREETS et la CCI, à l'échelle départementale, à partir des données disponibles (diagnostics, contacts consulaires, installations classées). Tenir éventuellement un registre des chaudières, fours et compresseurs à renouveler, pour engager l'accompagnement un à deux ans avant l'échéance.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-043'],
      electrificationAides['DSP-038'],
      electrificationAides['DOC-007'],
      electrificationAides['PAR-025'],
      electrificationAides['PAR-004'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '10.2.1',
    validation: 'validated',
    axeNumero: 10,
    sousAxeNumero: '10.2',
    champs: {
      titre:
        "Proposer aux industriels un parcours d'accompagnement, jusqu'au montage des dossiers de financement",
      description:
        "Prise de contact en s'appuyant sur les réseaux proches des industriels, selon l'organisation locale : conseillers Mon Parcours Économie d'Énergie (MPEE), CCI, CMA, agences de développement économique, collectivités, Région. Diagnostic et audit énergétique, étude du mix énergétique et trajectoire d'investissement (Pacte Industrie, Bpifrance, CCI) ; formation des référents énergie et des directions financières ; orientation vers les financements (primes CEE, aides de l'État, de la Région et des opérateurs) et appui au montage des dossiers. Le programme Electrifab de l'ATEE apporte outils et retours d'expérience. La collectivité peut porter, avec les acteurs locaux, des opérations collectives de décarbonation.",
    },
    sousActions: [],
    indicateurCodes: ['10.2.1-a', '10.2.1-b'],
    aides: [
      electrificationAides['DSP-038'],
      electrificationAides['DSP-045'],
      electrificationAides['DSP-011'],
      electrificationAides['DSP-012'],
      electrificationAides['DSP-046'],
      electrificationAides['DOC-007'],
      electrificationAides['PAR-004'],
      electrificationAides['PAR-025'],
      electrificationAides['DSP-015'],
      electrificationAides['DSP-055'],
      electrificationAides['DSP-056'],
      electrificationAides['DSP-057'],
      electrificationAides['DSP-054'],
      electrificationAides['PAR-032'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '10.2.2',
    validation: 'validated',
    axeNumero: 10,
    sousAxeNumero: '10.2',
    champs: {
      titre:
        "Suivre les décisions d'investissement des industriels accompagnés",
      description:
        "Suivi des projets engagés et des consommations électrifiées correspondantes, en lien avec le suivi de l'ADEME.",
    },
    sousActions: [],
    indicateurCodes: ['10.2.2-a', '10.2.2-b'],
    aides: [electrificationAides['PAR-004'], electrificationAides['PAR-031']],
  },
  {
    code: '10.2.3',
    validation: 'validated',
    axeNumero: 10,
    sousAxeNumero: '10.2',
    champs: {
      titre:
        "Construire avec Enedis et le syndicat d'énergie une réponse adaptée aux besoins électriques des zones industrielles",
      description:
        "Ingénierie sur mesure pour adapter la desserte électrique aux besoins actuels et futurs des entreprises. Le raccordement groupé peut y être expérimenté : une demande groupée de puissance portée avec le gestionnaire de la zone auprès d'Enedis, appuyée sur les intentions des entreprises. Là où une zone industrielle bas carbone a été retenue, la démarche s'y articule.",
    },
    sousActions: [
      {
        code: 'sous-action-057',
        champs: {
          titre:
            "Engager une démarche d'ingénierie avec Enedis et le syndicat d'énergie",
        },
      },
      {
        code: 'sous-action-058',
        champs: {
          titre:
            "Déposer une demande groupée de puissance pour au moins une zone d'activités",
        },
      },
    ],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-014'],
      electrificationAides['PAR-008'],
      electrificationAides['PAR-009'],
      electrificationAides['PAR-006'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '10.2.4',
    validation: 'validated',
    axeNumero: 10,
    sousAxeNumero: '10.2',
    champs: {
      titre:
        "Mettre en place un guichet à délais garantis pour instruire les permis de construire des projets d'électrification",
      description:
        "La collectivité s'engage sur ses propres délais : instruction prioritaire des autorisations d'urbanisme liées à un projet d'électrification.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [],
  },
  {
    code: '10.3.1',
    validation: 'validated',
    axeNumero: 10,
    sousAxeNumero: '10.3',
    champs: {
      titre: "Accompagner les projets d'écologie industrielle et territoriale",
      description:
        "Mettre en relation les entreprises d'une même zone et suivre leurs projets de mutualisation : équipements énergétiques partagés, récupération de chaleur fatale, avec l'appui du Fonds Chaleur et du réseau Synapse.",
    },
    sousActions: [],
    indicateurCodes: ['10.3.1-a'],
    aides: [
      electrificationAides['DSP-025'],
      electrificationAides['DOC-009'],
      electrificationAides['PAR-025'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '10.3.2',
    validation: 'validated',
    axeNumero: 10,
    sousAxeNumero: '10.3',
    champs: {
      titre:
        "Anticiper le raccordement électrique de fonciers d'activité attractifs",
      description:
        "Repérer les fonciers destinés à accueillir des activités industrielles ou artisanales et anticiper leur raccordement avec Enedis et RTE, pour réduire les délais d'installation des projets électrifiés.",
    },
    sousActions: [],
    indicateurCodes: ['10.3.2-a'],
    aides: [electrificationAides['PAR-008'], electrificationAides['PAR-009']],
  },
  {
    code: '11.1.1',
    validation: 'validated',
    axeNumero: 11,
    sousAxeNumero: '11.1',
    champs: {
      titre:
        "Cartographier les exploitations agricoles qui peuvent s'électrifier",
      description:
        "Serres chauffées, séchage, irrigation, bâtiments d'élevage, par taille d'exploitation. La statistique agricole (Agreste) en donne une première image, que la DRAAF et la chambre d'agriculture peuvent compléter.",
    },
    sousActions: [],
    indicateurCodes: ['11.1.1-a'],
    aides: [electrificationAides['PAR-027']],
  },
  {
    code: '11.2.1',
    validation: 'validated',
    axeNumero: 11,
    sousAxeNumero: '11.2',
    champs: {
      titre:
        "Aller au-devant des agriculteurs et les accompagner selon leurs usages, jusqu'au financement",
      description:
        "Prise de contact directe et parcours d'accompagnement par usage. Présenter clairement les aides disponibles, accompagner les études technico-économiques (serres : pompe à chaleur, géothermie, récupération de chaleur ; séchage ; irrigation ; élevage : récupération de chaleur sur le tank à lait) et regrouper si possible les demandes de financement.",
    },
    sousActions: [],
    indicateurCodes: ['11.2.1-a', '11.2.1-b'],
    aides: [
      electrificationAides['DSP-041'],
      electrificationAides['DSP-025'],
      electrificationAides['PAR-027'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '11.2.2',
    validation: 'validated',
    axeNumero: 11,
    sousAxeNumero: '11.2',
    champs: {
      titre:
        'Repérer les projets agricoles par les permis de construire et y proposer des solutions électriques',
      description:
        "Un projet de bâtiment d'élevage, de serre ou de hangar est déjà financé : y ajouter l'électrification (pompe à chaleur, récupération de chaleur, préparation à l'installation photovoltaïque) coûte peu.",
    },
    sousActions: [],
    indicateurCodes: ['11.2.2-a'],
    aides: [electrificationAides['PAR-027']],
  },
  {
    code: '11.2.3',
    validation: 'validated',
    axeNumero: 11,
    sousAxeNumero: '11.2',
    champs: {
      titre:
        'Travailler avec les laiteries et les coopératives pour valoriser les équipements électriques',
      description:
        'Dans les contrats de collecte ou les démarches qualité : récupération de chaleur sur le tank, pré-refroidisseurs.',
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-027']],
  },
  {
    code: '11.2.4',
    validation: 'validated',
    axeNumero: 11,
    sousAxeNumero: '11.2',
    champs: {
      titre:
        "Caler l'accompagnement sur le calendrier des appels à projets agricoles",
      description:
        "Les aides à l'investissement agricole (FEADER, plans régionaux) ouvrent à dates fixes : organiser les campagnes d'accompagnement et le montage des dossiers en fonction.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [electrificationAides['PAR-027'], electrificationAides['PAR-029']],
  },
  {
    code: '11.2.5',
    validation: 'validated',
    axeNumero: 11,
    sousAxeNumero: '11.2',
    champs: {
      titre:
        "S'appuyer sur les projets existants de hangars photovoltaïques et d'agrivoltaïsme pour électrifier les équipements des exploitations concernées",
      description:
        "Lorsqu'un projet photovoltaïque est porté par un développeur, prévoir que le bâtiment et son local technique permettent d'électrifier les usages (séchage, tank à lait, irrigation). La collectivité peut aider à standardiser ces montages.",
    },
    sousActions: [],
    indicateurCodes: ['11.2.5-a'],
    aides: [electrificationAides['PAR-027'], electrificationAides['PAR-008']],
  },
  {
    code: '11.3.1',
    validation: 'validated',
    axeNumero: 11,
    sousAxeNumero: '11.3',
    champs: {
      titre:
        'Organiser des démonstrations et des visites dans les exploitations pour présenter les engins électriques',
      description:
        "Démonstrations, témoignages d'agriculteurs équipés, visites individualisées des principales exploitations : présentation du programme E-Trans et aide au montage des dossiers.",
    },
    sousActions: [],
    indicateurCodes: ['11.3.1-a'],
    aides: [
      electrificationAides['DSP-018'],
      electrificationAides['PAR-027'],
      electrificationAides['PAR-028'],
      electrificationAides['PAR-031'],
    ],
  },
  {
    code: '11.3.2',
    validation: 'validated',
    axeNumero: 11,
    sousAxeNumero: '11.3',
    champs: {
      titre:
        "Conventionner avec la CUMA pour électrifier le matériel qu'elle met à disposition",
      description:
        "Désherbage électrique, robots, séchage mobile, matériel d'irrigation ; dossiers E-Trans portés collectivement.",
    },
    sousActions: [],
    indicateurCodes: [],
    aides: [
      electrificationAides['DSP-018'],
      electrificationAides['PAR-028'],
      electrificationAides['PAR-027'],
      electrificationAides['PAR-031'],
    ],
  },
];
