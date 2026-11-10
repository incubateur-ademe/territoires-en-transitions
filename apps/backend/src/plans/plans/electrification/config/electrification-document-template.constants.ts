import { ElectrificationEngagementCodeEnum as EngagementCode } from '@tet/domain/plans';

/**
 * Contrat de lecture du canevas officiel Word V4, que l'application ne modifie pas.
 * Les libellés identifient les champs ; les placeholders reconnaissent les cellules non remplies.
 * Les codes font le lien avec le catalogue métier, dont les définitions restent indépendantes.
 * Toute variante acceptée doit provenir d'un document observé et être couverte par les e2e.
 * La fixture du canevas reste indépendante pour vérifier ce contrat.
 */
export const electrificationDocumentTemplate = {
  // Révision du canevas officiel, indépendante du format technique du checkpoint.
  version: 'electrification-v4',
  engagements: {
    // Titres du Word officiel, indépendants des titres métier utilisés dans le plan.
    axes: [
      {
        numero: 1,
        label: 'Axe 1. Logements privés : sortie du fioul et du gaz',
      },
      { numero: 2, label: 'Axe 2. Logements sociaux : sortie du gaz' },
      {
        numero: 3,
        label: 'Axe 3. Bâtiments publics : sortie du fioul et du gaz',
      },
      {
        numero: 4,
        label:
          'Axe 4. Réseau de gaz : décommissionnement de certaines portions',
      },
      { numero: 5, label: 'Axe 5. Véhicules particuliers électriques' },
      { numero: 6, label: 'Axe 6. Bornes de recharge' },
      { numero: 7, label: 'Axe 7. Recharge des poids lourds' },
      { numero: 8, label: 'Axe 8. Autobus électriques' },
      { numero: 9, label: 'Axe 9. Artisans' },
      { numero: 10, label: 'Axe 10. Industrie' },
      { numero: 11, label: 'Axe 11. Agriculture' },
    ],
    // Les trois préfixes tolèrent les précisions entre parenthèses du canevas.
    columns: {
      axe: "Axe du plan d'action",
      engagement: 'Engagement du programme',
      selection: 'Engagement retenu',
      cible: "Valeur chiffrée de l'engagement",
    },
    labels: {
      [EngagementCode.SORTIE_FIOUL_LOGEMENTS_PRIVES]:
        "Le territoire s'engage à la sortie de l'usage du fioul domestique pour ___ % des bâtiments actuellement chauffés au fioul d'ici 2030.",
      [EngagementCode.SORTIE_GAZ_LOGEMENTS_PRIVES]:
        "Le territoire s'engage à la sortie de l'usage du gaz pour ___ % des bâtiments usant du gaz d'ici 2030.",
      [EngagementCode.SORTIE_GAZ_LOGEMENTS_SOCIAUX]:
        "Le territoire s'engage à accélérer fortement la sortie du gaz des logements sociaux, pour ___ % des logements sociaux actuellement chauffés au gaz d'ici 2030.",
      [EngagementCode.SORTIE_GAZ_BATIMENTS_PUBLICS]:
        "Le territoire s'engage à accélérer fortement la sortie du gaz des bâtiments publics, pour ___ % des bâtiments actuellement chauffés au gaz d'ici 2030.",
      [EngagementCode.DECOMMISSIONNEMENT_RESEAU_GAZ]:
        "Le territoire s'engage à travailler à un décommissionnement de certaines portions du réseau de gaz.",
      [EngagementCode.ELECTRIFICATION_VEHICULES_PARTICULIERS]:
        "Le territoire s'engage pour accélérer fortement l'électrification des véhicules particuliers, afin d'atteindre un parc de véhicules y étant immatriculés de ___ % d'ici 2030.",
      [EngagementCode.BORNES_RECHARGE_PUBLIQUES]:
        "Le territoire s'engage à renforcer le schéma des infrastructures de recharge pour véhicules électriques, avec l'objectif d'installer ___ bornes publiques dont ___ rapides d'ici 2030.",
      [EngagementCode.SITE_RECHARGE_POIDS_LOURDS]:
        "Le territoire s'engage à identifier un site clés en main pour l'installation de stations de recharge de poids lourds électriques.",
      [EngagementCode.ELECTRIFICATION_AUTOBUS]:
        "Le territoire s'engage à disposer d'un parc d'autobus électrique représentant ___ % du parc total d'ici 2030.",
      [EngagementCode.ELECTRIFICATION_ARTISANS]:
        "Le territoire s'engage à accompagner ___ artisans dans leur électrification, avec l'objectif de remplacer des équipements carbonés (ex : four à pain au gaz) d'ici 2030.",
      [EngagementCode.ELECTRIFICATION_INDUSTRIE]:
        "Le territoire s'engage à accompagner les industriels dans leur électrification, avec l'objectif de conduire des projets pour une consommation de ___ MWh en 2030.",
      [EngagementCode.ELECTRIFICATION_AGRICULTURE]:
        "Le territoire s'engage à accompagner les agriculteurs dans leur électrification avec l'objectif de conduire des projets pour une consommation de ___ MWh en 2030.",
    },
  },
  fiches: {
    fields: [
      {
        key: 'axe',
        label: 'Axe',
        placeholder:
          "Axe de rattachement : n° d'un axe du Référentiel, de préférence celui d'un engagement retenu au tableau A (ex : 1), ou intitulé d'un axe propre au territoire (sans n°)",
      },
      {
        key: 'sousAxe',
        label: 'Sous-axe (facultatif)',
        placeholder:
          "Sous-axe de rattachement : n° d'un sous-axe du Référentiel (ex : 1.1), ou intitulé d'un sous-axe propre au territoire (sans n°)",
      },
      {
        key: 'reference',
        label: "Code de l'action de référence ou URL de l'action (facultatif)",
        placeholder:
          "Code de l'action dans le Référentiel, ou URL de l'action déjà présente sur la plateforme Territoires en Transitions, si connu",
      },
      {
        key: 'titre',
        label: "Intitulé de l'action",
        placeholder: "Intitulé de l'action",
      },
      {
        key: 'description',
        label: "Description de l'action",
        placeholder:
          "Contenu de l'action : ce qui sera fait, comment, sur quel périmètre",
      },
      {
        key: 'objectifs',
        label: "Objectif(s) de l'action",
        placeholder: "Résultat visé par l'action, de préférence chiffré",
      },
      {
        key: 'structures',
        label: 'Structure pilote (facultatif)',
        placeholder: "Structure(s) pilote(s) de l'action",
      },
      {
        key: 'partenaires',
        label: 'Partenaire(s) (parties prenantes) (facultatif)',
        placeholder:
          "Structures partenaires de l'action (cf. Annexe 2) : services de l'Etat, ADEME, opérateurs, bailleurs, entreprises, associations...",
      },
      {
        key: 'dateDebut',
        label: 'Date de début prévisionnelle',
        placeholder: 'JJ/MM/AAAA (ou mois et année)',
      },
      {
        key: 'dateFin',
        label: 'Date de fin prévisionnelle',
        placeholder: 'JJ/MM/AAAA (ou mois et année)',
      },
      {
        key: 'statut',
        label: "État d'avancement au moment de la signature",
        placeholder:
          "À venir / À discuter / En cours / Réalisé / En retard / En pause / Abandonné / Bloqué (ne conserver qu'une mention)",
      },
    ],
    headings: [
      'Rattachement',
      "Description de l'action",
      'Pilotage',
      'Calendrier et avancement',
      "Moyens et besoins d'accompagnement",
    ],
    budgetLabel: 'Budget prévisionnel en € HT (facultatif)',
    sousActions: {
      heading: 'Sous-actions (facultatif)',
      columns: ['Intitulé de la sous-action', 'Date de fin'],
      placeholders: {
        titre: 'Une ligne par sous-action (ajouter lignes si besoin)',
        dateFin: 'JJ/MM/AAAA',
      },
    },
    indicateurs: {
      heading: 'Indicateurs de suivi',
      columns: [
        "Code ou URL de l'indicateur (facultatif)",
        "Intitulé de l'indicateur",
        'Valeur de résultat (avec son année de référence)',
        "Valeur d'objectif à 2030",
      ],
      placeholders: {
        reference:
          "Code de l'indicateur du Référentiel, ou URL de l'indicateur déjà présent sur la plateforme Territoires en Transitions (laisser vide pour un indicateur propre au territoire)",
        titre:
          "Si ni code ni URL : intitulé et unité de l'indicateur (ex : nombre de boulangeries ayant remplacé leur four au gaz)",
      },
    },
  },
} as const;
