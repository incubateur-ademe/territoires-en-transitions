// Contrat de la source ADEME : changer de document/table exige de vérifier les
// identités, notamment les identifiants de lignes des sous-actions.
export const electrificationGristConfig = {
  catalogue: {
    // Identifiants techniques stables de la colonne "source" de "Références externes".
    // Distinguent les indicateurs du catalogue des cibles d'engagement.
    // À conserver si le titre, le contenu ou l'adresse Grist (lienSource) change.
    indicateurReferenceSource: 'catalogue-electrification',
    engagementReferenceSource: 'engagements-electrification',
    tables: {
      Axes: 'V1_3_Axes',
      Sous_axes: 'V1_3_Sous_axes',
      Actions: 'V1_3_Actions',
      Sous_actions: 'V1_3_Sous_actions',
      Indicateurs: 'V1_3_Indicateurs',
      Ressources: 'V1_3_Ressources',
    },
  },
  laureats: {
    table: 'Territoires',
  },
} as const;
