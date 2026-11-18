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
    // Les trois préfixes tolèrent les précisions entre parenthèses du canevas.
    columns: {
      axe: "Axe du plan d'action",
      engagement: 'Engagement du programme',
      selection: 'Engagement retenu',
      cible: "Valeur chiffrée de l'engagement",
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
