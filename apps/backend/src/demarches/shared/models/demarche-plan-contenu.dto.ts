import { z } from 'zod';

const demarchePlanContenuFicheSchema = z.object({
  id: z.number().int(),
  titre: z.string().nullable(),
});

/**
 * Un plan rattaché à une démarche et son contenu, aplati : les axes portent
 * leur profondeur plutôt qu'un arbre imbriqué, ce qui suffit à les indenter et
 * évite au front de reconstruire une hiérarchie.
 *
 * Partagé par les deux côtés du dossier — l'instructeur qui lit le programme
 * d'actions transmis, et la collectivité qui s'y reporte pendant la
 * finalisation. Les deux ont le même besoin : voir le plan, sans y toucher.
 */
export const demarchePlanContenuSchema = z.object({
  id: z.number().int(),
  nom: z.string().nullable(),
  nbFiches: z.number().int(),
  /** Fiches rattachées au plan sans passer par un axe. */
  fiches: demarchePlanContenuFicheSchema.array(),
  axes: z
    .object({
      id: z.number().int(),
      nom: z.string().nullable(),
      /** 1 pour un axe de premier niveau ; la racine est le plan lui-même. */
      depth: z.number().int(),
      fiches: demarchePlanContenuFicheSchema.array(),
    })
    .array(),
});

export type DemarchePlanContenu = z.infer<typeof demarchePlanContenuSchema>;
