/** En-têtes et ligne de socle commun des canevas Word officiels. */
export const electrificationEngagementsDocument = {
  socleCommun: {
    axe: 'Aucun axe dédié',
    selection: 'Oui (socle commun)',
  },
  // Les trois préfixes tolèrent les précisions entre parenthèses du canevas.
  columns: {
    axe: "Axe du plan d'action",
    engagement: 'Engagement du programme',
    selection: 'Engagement retenu',
    cible: "Valeur chiffrée de l'engagement",
  },
} as const;
