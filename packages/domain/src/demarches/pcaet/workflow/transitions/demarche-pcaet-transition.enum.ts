/**
 * Noms des transitions du cycle de vie. Chaque nom a sa propre opération côté
 * API (`transmettrePourAvis`, `publier`…) : il ne transite jamais en argument.
 */
export const DemarchePcaetTransitionEnum = {
  TRANSMETTRE_POUR_AVIS: 'transmettre_pour_avis',
  REPRENDRE_ELABORATION: 'reprendre_elaboration',
  ADOPTER: 'adopter',
  ARCHIVER: 'archiver',
  PUBLIER: 'publier',
  DEPUBLIER: 'depublier',
} as const;

export type DemarchePcaetTransition =
  (typeof DemarchePcaetTransitionEnum)[keyof typeof DemarchePcaetTransitionEnum];

export const demarchePcaetTransitionValues = Object.values(
  DemarchePcaetTransitionEnum
) as [DemarchePcaetTransition, ...DemarchePcaetTransition[]];
