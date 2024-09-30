import { z } from 'zod';

// Enums

export const statutSchema = z.enum([
  'À venir',
  'En cours',
  'Réalisé',
  'En pause',
  'Abandonné',
  'Bloqué',
  'En retard',
  'A discuter',
]);

export type Statut = z.infer<typeof statutSchema>;

export const niveauPrioriteSchema = z.enum(['Élevé', 'Moyen', 'Bas']);

export type NiveauPriorite = z.infer<typeof niveauPrioriteSchema>;

// Fiche Résumé

export const ficheResumeSchema = z.object({
  id: z.number(),
  collectivite_id: z.number(),
  plan_id: z.number().nullish(),
  titre: z.string(),
  statut: statutSchema.nullable(),
  niveau_priorite: niveauPrioriteSchema.nullable(),
  amelioration_continue: z.boolean().nullable(),
  restreint: z.boolean().nullable(),
  date_fin_provisoire: z.string().datetime().nullable(),
  modified_at: z.string().datetime().nullable(),

  plans: z
    .object({
      id: z.number().optional(),
      nom: z.string().nullish(),
      collectivite_id: z.number(),
      created_at: z.string().datetime().optional(),
      modified_at: z.string().datetime().optional(),
      modified_by: z.string().nullish(),
      parent: z.number().nullish(),
      plan: z.number().nullish(),
      type: z.number().nullish(),
    })
    .array()
    .nullable(),

  pilotes: z
    .array(
      z.object({
        nom: z.string().nullable(),
        collectivite_id: z.number().nullable(),
        tag_id: z.number().nullish(),
        user_id: z.string().nullish(),
      })
    )
    .nullable(),

  services: z
    .array(
      z.object({
        nom: z.string().nullable(),
        collectivite_id: z.number().nullable(),
        id: z.number().nullish(),
      })
    )
    .nullable(),
});

export type FicheResume = z.infer<typeof ficheResumeSchema>;
