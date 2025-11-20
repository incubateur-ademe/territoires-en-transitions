import * as z from 'zod/mini';
import { referentielIdEnumSchema } from '../referentiels/referentiel-id.enum';

const membreFonctionEnumValues = [
  'conseiller',
  'technique',
  'politique',
  'partenaire',
] as const;
const membreFonctionEnumSchema = z.enum(membreFonctionEnumValues);

export type MembreFonction = (typeof membreFonctionEnumValues)[number];

export const membreSchema = z.object({
  userId: z.uuid(),
  collectiviteId: z.number(),
  fonction: z.nullable(membreFonctionEnumSchema),
  detailsFonction: z.nullable(z.string()),
  champIntervention: z.nullable(z.array(referentielIdEnumSchema)),
  estReferent: z.nullable(z.boolean()),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
});

export type Membre = z.infer<typeof membreSchema>;

export const membreCreateSchema = z.object({
  userId: z.uuid(),
  collectiviteId: z.number(),
  fonction: z.optional(z.nullable(membreFonctionEnumSchema)),
  detailsFonction: z.optional(z.nullable(z.string())),
  champIntervention: z.optional(z.nullable(z.array(referentielIdEnumSchema))),
  estReferent: z.optional(z.nullable(z.boolean())),
  createdAt: z.optional(z.iso.datetime()),
  modifiedAt: z.optional(z.iso.datetime()),
});

export type MembreCreate = z.infer<typeof membreCreateSchema>;
