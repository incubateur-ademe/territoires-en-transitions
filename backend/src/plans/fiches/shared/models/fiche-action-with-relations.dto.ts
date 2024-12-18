import z from 'zod';
import { ficheSchema } from './fiche-action.table';

export const ficheActionWithRelationsSchema = ficheSchema.extend({
  partenaires: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Partenaires'),
  pilotes: z
    .object({
      tagId: z.number().nullable(),
      userId: z.string().nullable(),
      nom: z.string(),
      prenom: z.string().optional(),
      email: z.string().optional(),
    })
    .array()
    .describe('Personnes pilote'),
  referents: z
    .object({
      tagId: z.number().nullable(),
      userId: z.string().nullable(),
      nom: z.string(),
      prenom: z.string().optional(),
      email: z.string().optional(),
    })
    .array()
    .describe('Élu·e référent·e'),
  tags: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Tags personnalisés'),
  financeurs: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Financeurs'),
  sousThematiques: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Sous-thématiques'),
  thematiques: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Thématiques'),
  structures: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Structure pilote'),
  indicateurs: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Indicateurs associés'),
  services: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Directions ou services pilote'),
  effetsAttendus: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe('Effets attendus'),
  axes: z
    .object({
      id: z.number(),
      nom: z.string(),
      parentId: z.number().nullable(),
      parentNom: z.string().nullable(),
    })
    .array()
    .describe('Axes'),
  plans: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .describe("Plans d'action"),
});

export type FicheActionWithRelationsType = z.infer<
  typeof ficheActionWithRelationsSchema
>;
