import {z} from "zod";

/**
 * Schéma zod d'un axe d'un plan d'action avec les liens vers les autres objets sous forme d'id
 */
export const axeSchema = z.object({
    id : z.string(),
    collectiviteId : z.number(),
    nom : z.string().nullable(),
    parent : z.number().nullable(),
    plan : z.number().nullable(),
    type : z.number().nullable(),
    createdAt : z.string().date().nullable(),
    modifiedAt: z.string().date().nullable(),
    modifiedBy : z.string().nullable()
});

/**
 * Type TS d'un axe d'un plan d'action avec les liens vers les autres objets sous forme d'id
 */
export type Axe = z.input<typeof axeSchema>;