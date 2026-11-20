/** Champs normalisés des indicateurs ; leur disposition dépend du format Word. */
export const electrificationIndicateursDocument = {
  heading: 'Indicateurs de suivi',
  fields: {
    reference: {
      label: "Code ou URL de l'indicateur (facultatif)",
      placeholder:
        "Code de l'indicateur du Référentiel, ou URL de l'indicateur déjà présent sur la plateforme Territoires en Transitions (laisser vide pour un indicateur propre au territoire)",
    },
    titre: {
      label: "Intitulé de l'indicateur",
      placeholder:
        "Si ni code ni URL : intitulé et unité de l'indicateur (ex : nombre de boulangeries ayant remplacé leur four au gaz)",
    },
    resultat: { label: 'Valeur de résultat (avec son année de référence)' },
    objectif: { label: "Valeur d'objectif à 2030" },
    objectifComplementaire: {
      label: "Autre valeur d'objectif (avec son année)",
    },
  },
} as const;
