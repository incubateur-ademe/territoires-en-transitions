import {
  collectiviteSchema,
  financeurTagSchema,
  libreTagSchema,
  partenaireTagSchema,
  personneIdSchema,
  serviceTagSchema,
  structureTagSchema,
} from '@tet/domain/collectivites';
import { indicateurDefinitionSchema } from '@tet/domain/indicateurs';
import { axeSchema, ficheSchema, ficheSchemaUpdate } from '@tet/domain/plans';
import { actionRelationSchema } from '@tet/domain/referentiels';
import {
  effetAttenduSchema,
  sousThematiqueSchema,
  tempsDeMiseEnOeuvreSchema,
  thematiqueSchema,
} from '@tet/domain/shared';
import z from 'zod';
import * as zm from 'zod/mini';

const financeurSchema = financeurTagSchema.pick({ id: true }).extend({
  id: financeurTagSchema.shape.id,
});

const financeurWithMontantSchema = z.object({
  financeurTag: financeurSchema.nullish(),
  montantTtc: z.number().nullish(),
});

export const updateFicheRequestSchema = ficheSchemaUpdate.extend({
  budgetPrevisionnel: z
    .string()
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

  tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvreSchema.pick({ id: true }).nullish(),
  axes: z.array(zm.pick(axeSchema, { id: true })).nullish(),
  thematiques: z.array(zm.pick(thematiqueSchema, { id: true })).nullish(),
  sousThematiques: sousThematiqueSchema.pick({ id: true }).array().nullish(),
  partenaires: partenaireTagSchema.pick({ id: true }).array().nullish(),
  structures: structureTagSchema.pick({ id: true }).array().nullish(),
  pilotes: personneIdSchema.array().nullish(),
  referents: personneIdSchema.array().nullish(),
  sharedWithCollectivites: collectiviteSchema
    .pick({ id: true })
    .array()
    .nullish(),
  mesures: z.array(zm.pick(actionRelationSchema, { id: true })).nullish(),
  indicateurs: z
    .array(zm.pick(indicateurDefinitionSchema, { id: true }))
    .nullish(),
  services: z.array(zm.pick(serviceTagSchema, { id: true })).nullish(),
  financeurs: financeurWithMontantSchema.array().nullish(),
  fichesLiees: ficheSchema.pick({ id: true }).array().nullish(),
  effetsAttendus: effetAttenduSchema.pick({ id: true }).array().nullish(),
  libreTags: libreTagSchema.pick({ id: true }).array().nullish(),
});

export type UpdateFicheRequest = z.infer<typeof updateFicheRequestSchema>;
