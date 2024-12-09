import {
  financeurTagSchema,
  partenaireTagSchema,
  serviceTagSchema,
  structureTagSchema,
} from '@/backend/collectivites';
import { indicateurDefinitionSchema } from '@/backend/indicateurs';
import {
  axeSchema,
  CiblesEnumType,
  ficheActionSchema,
  piliersEciEnumType,
  updateFicheActionSchema,
} from '@/backend/plans/fiches';
import { actionRelationSchema } from '@/backend/referentiels';
import {
  effetAttenduSchema,
  sousThematiqueSchema,
  thematiqueSchema,
} from '@/backend/shared';
import z from 'zod';

// There is no proper Pilote or Referent tables, so we use a custom schema here
export const personneSchema = z.object({
  tagId: z.number().nullish(),
  userId: z.string().uuid().nullish(),
});

const financeurSchema = financeurTagSchema.pick({ id: true }).extend({
  id: financeurTagSchema.shape.id,
});

const financeurWithMontantSchema = z.object({
  financeurTag: financeurSchema.nullish(),
  montantTtc: z.number().nullish(),
});

export const updateFicheActionRequestSchema = updateFicheActionSchema.extend({
  // We're overriding piliersEci and cibles because,
  // for some unknown reason (a bug with zod/drizzle ?), extend() looses enum's array
  piliersEci: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.replace(/'/g, '’') : val),
      z.nativeEnum(piliersEciEnumType)
    )
    .array()
    .nullish(),
  cibles: z.nativeEnum(CiblesEnumType).array().nullish(),
  // Overriding because numeric and timestamp types are not properly converted otherwise (a bug with zod/drizzle ?)
  budgetPrevisionnel: z
    .union([z.string(), z.number()])
    .transform((val) => val.toString())
    .refine((val) => !isNaN(Number(val)), {
      message: "Expected 'budgetPrevisionnel' to be a numeric string",
    })
    .nullish(),
  dateDebut: z
    .string()
    .nullable()
    .refine((val) => val === null || !isNaN(Date.parse(val)), {
      message: "Invalid date format for 'dateDebut'",
    })
    .nullish(),

  tempsDeMiseEnOeuvre: z
    .union([
      z.number(),
      z.object({
        id: z.number(),
        nom: z.string(),
      }),
    ])
    .transform((val) => (typeof val === 'number' ? val : val.id))
    .nullish(),

  axes: axeSchema.pick({ id: true }).array().nullish(),
  thematiques: thematiqueSchema.pick({ id: true }).array().nullish(),
  sousThematiques: sousThematiqueSchema.pick({ id: true }).array().nullish(),
  partenaires: partenaireTagSchema.pick({ id: true }).array().nullish(),
  structures: structureTagSchema.pick({ id: true }).array().nullish(),
  pilotes: personneSchema.array().nullish(),
  referents: personneSchema.array().nullish(),
  actions: actionRelationSchema.pick({ id: true }).array().nullish(),
  indicateurs: indicateurDefinitionSchema.pick({ id: true }).array().nullish(),
  services: serviceTagSchema.pick({ id: true }).array().nullish(),
  financeurs: z.array(financeurWithMontantSchema).nullish(),
  fichesLiees: ficheActionSchema.pick({ id: true }).array().nullish(),
  resultatsAttendus: effetAttenduSchema.pick({ id: true }).array().nullish(),
});

export type UpdateFicheActionRequestType = z.infer<
  typeof updateFicheActionRequestSchema
>;
