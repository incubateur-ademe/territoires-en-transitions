import {
  libreTagSchema,
  partenaireTagSchema,
  serviceTagSchema,
  structureTagSchema,
} from '@/backend/collectivites';
import z from 'zod';
import { financeurTagSchema } from '../../../collectivites/shared/models/financeur-tag.table';
import { indicateurDefinitionSchema } from '../../../indicateurs/models/indicateur-definition.table';
import { actionRelationSchema } from '../../../referentiels/models/action-relation.table';
import { effetAttenduSchema } from '../../../shared/models/effet-attendu.table';
import { sousThematiqueSchema } from '../../../shared/models/sous-thematique.table';
import { thematiqueSchema } from '../../../shared/models/thematique.table';
import { axeSchema } from './models/axe.table';
import {
  ciblesEnumSchema,
  ficheSchema,
  ficheSchemaUpdate,
  piliersEciEnumType,
} from './models/fiche-action.table';

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

export const editFicheRequestSchema = ficheSchemaUpdate.extend({
  // We're overriding piliersEci and cibles because,
  // for some unknown reason (a bug with zod/drizzle ?), extend() looses enum's array
  piliersEci: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.replace(/'/g, '’') : val),
      z.nativeEnum(piliersEciEnumType)
    )
    .array()
    .nullish(),
  cibles: ciblesEnumSchema.array().nullish(),
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
  financeurs: financeurWithMontantSchema.array().nullish(),
  fichesLiees: ficheSchema.pick({ id: true }).array().nullish(),
  resultatsAttendus: effetAttenduSchema.pick({ id: true }).array().nullish(),
  libresTag: libreTagSchema.pick({ id: true }).array().nullish(),
});

export type UpdateFicheActionRequestType = z.infer<
  typeof editFicheRequestSchema
>;

export type UpdateFicheActionType = z.infer<typeof ficheSchemaUpdate>;
