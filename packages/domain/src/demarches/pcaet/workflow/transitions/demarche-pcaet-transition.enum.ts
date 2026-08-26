/**
 * Noms des transitions du cycle de vie. Chaque nom a sa propre opération côté
 * API (`transmettrePourAvis`, `publier`…) : il ne transite jamais en argument.
 *
 * Deux conventions de nommage, qui disent qui agit :
 * - **infinitif** — un acte de la collectivité, donc gardé par `estPilote` et
 *   proposé dans l'interface ;
 * - **participe passé** — un événement constaté par le système, sans acteur ni
 *   entrée de menu (`avis_tous_rendus`, `delai_avis_echu`).
 */
export const DemarchePcaetTransitionEnum = {
  TRANSMETTRE_POUR_AVIS: 'transmettre_pour_avis',
  REPRENDRE_ELABORATION: 'reprendre_elaboration',
  AVIS_TOUS_RENDUS: 'avis_tous_rendus',
  DELAI_AVIS_ECHU: 'delai_avis_echu',
  ARCHIVER: 'archiver',
  PUBLIER: 'publier',
  DEPUBLIER: 'depublier',
} as const;

export type DemarchePcaetTransition =
  (typeof DemarchePcaetTransitionEnum)[keyof typeof DemarchePcaetTransitionEnum];

export const demarchePcaetTransitionValues = Object.values(
  DemarchePcaetTransitionEnum
) as [DemarchePcaetTransition, ...DemarchePcaetTransition[]];
