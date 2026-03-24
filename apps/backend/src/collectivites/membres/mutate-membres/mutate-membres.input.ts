import { membreFonctionEnumSchema } from '@tet/domain/collectivites';
import { referentielIdEnumValues } from '@tet/domain/referentiels';
import { collectiviteRoleEnumValues } from '@tet/domain/users';
import z from 'zod';

export const updateMembreInputSchema = z.object({
  collectiviteId: z.number(),
  userId: z.string(),
  fonction: z.nullable(membreFonctionEnumSchema).optional(),
  detailsFonction: z.string().nullable().optional(),
  champIntervention: z
    .array(z.enum(referentielIdEnumValues))
    .nullable()
    .optional(),
  estReferent: z.boolean().nullable().optional(),
  role: z.enum(collectiviteRoleEnumValues).optional(),
});

export type UpdateMembreInput = z.infer<typeof updateMembreInputSchema>;

export const removeMembreInputSchema = z.object({
  collectiviteId: z.number(),
  userId: z.string(),
});

export type RemoveMembreInput = z.infer<typeof removeMembreInputSchema>;

export const joinAsMembreInputSchema = z.object({
  collectiviteId: z.number(),
  fonction: membreFonctionEnumSchema,
  detailsFonction: z.string().optional().default(''),
  champIntervention: z
    .array(z.enum(referentielIdEnumValues))
    .optional()
    .default([]),
  estReferent: z.boolean().optional().default(false),
});

export type JoinAsMembreInput = z.infer<typeof joinAsMembreInputSchema>;
