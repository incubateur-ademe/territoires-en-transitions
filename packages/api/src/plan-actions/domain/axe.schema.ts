import {z} from "zod";

/**
 * Schéma zod d'un axe d'un plan d'action avec les liens vers les autres objets sous forme d'id
 */
export const axeSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  nom: z.string().nullable().optional(),
  parent: z.number().nullable(),
  plan: z.number().nullable(),
  type: z.number().nullable(),
  createdAt: z.string().date().optional(),
  modifiedAt: z.string().date().optional(),
  modifiedBy: z.string().nullable(),
});

/**
 * Type TS d'un axe d'un plan d'action avec les liens vers les autres objets sous forme d'id
 */
export type Axe = z.input<typeof axeSchema>;