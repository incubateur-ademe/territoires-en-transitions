/** Champs et sections des actions, communs aux canevas Word pris en charge. */
export const electrificationFichesDocument = {
  fields: {
    axe: {
      label: 'Axe',
      placeholder:
        "Axe de rattachement : n° d'un axe du Référentiel, de préférence celui d'un engagement retenu au tableau A (ex : 1), ou intitulé d'un axe propre au territoire (sans n°)",
    },
    sousAxe: {
      label: 'Sous-axe (facultatif)',
      placeholder:
        "Sous-axe de rattachement : n° d'un sous-axe du Référentiel (ex : 1.1), ou intitulé d'un sous-axe propre au territoire (sans n°)",
    },
    reference: {
      label: "Code de l'action de référence ou URL de l'action (facultatif)",
      placeholder:
        "Code de l'action dans le Référentiel, ou URL de l'action déjà présente sur la plateforme Territoires en Transitions, si connu",
    },
    titre: {
      label: "Intitulé de l'action",
      placeholder: "Intitulé de l'action",
    },
    description: {
      label: "Description de l'action",
      placeholder:
        "Contenu de l'action : ce qui sera fait, comment, sur quel périmètre",
    },
    objectifs: {
      label: "Objectif(s) de l'action",
      placeholder: "Résultat visé par l'action, de préférence chiffré",
    },
    structures: {
      label: 'Structure pilote (facultatif)',
      placeholder: "Structure(s) pilote(s) de l'action",
    },
    partenaires: {
      label: 'Partenaire(s) (parties prenantes) (facultatif)',
      placeholder:
        "Structures partenaires de l'action (cf. Annexe 2) : services de l'Etat, ADEME, opérateurs, bailleurs, entreprises, associations...",
    },
    dateDebut: {
      label: 'Date de début prévisionnelle',
      placeholder: 'JJ/MM/AAAA (ou mois et année)',
    },
    dateFin: {
      label: 'Date de fin prévisionnelle',
      placeholder: 'JJ/MM/AAAA (ou mois et année)',
    },
    statut: {
      label: "État d'avancement au moment de la signature",
      placeholder:
        "À venir / À discuter / En cours / Réalisé / En retard / En pause / Abandonné / Bloqué (ne conserver qu'une mention)",
    },
  },
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
} as const;
