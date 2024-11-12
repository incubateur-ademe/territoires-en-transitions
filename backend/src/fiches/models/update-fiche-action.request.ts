import z from 'zod';
import {
  FicheActionCiblesEnumType,
  ficheActionPiliersEciEnumType,
  ficheActionSchema,
  updateFicheActionSchema,
} from './fiche-action.table';
import { axeSchema } from './axe.table';
import { thematiqueSchema } from '../../taxonomie/models/thematique.table';
import { partenaireTagSchema } from '../../taxonomie/models/partenaire-tag.table';
import { serviceTagSchema } from '../../taxonomie/models/service-tag.table';
import { effetAttenduSchema } from '../../taxonomie/models/effet-attendu.table';
import { actionRelationSchema } from '../../referentiel/models/action-relation.table';
import { indicateurDefinitionSchema } from '../../indicateurs/models/indicateur-definition.table';
import { sousThematiqueSchema } from '../../taxonomie/models/sous-thematique.table';
import { financeurTagSchema } from '../../taxonomie/models/financeur-tag.table';
import { structureTagSchema } from '../../taxonomie/models/structure-tag.table';

// There is no proper Pilote or Referent tables, so we use a custom schema here
const piloteOrReferentSchema = z.object({
  nom: z.string(),
  collectiviteId: z.number(),
  tagId: z.number(),
  userId: z.string().uuid(),
});

const financeurSchema = financeurTagSchema.pick({ id: true }).extend({
  id: financeurTagSchema.shape.id,
});

const financeurWithMontantSchema = z.object({
  financeurTag: financeurSchema.optional(),
  montantTtc: z.number().optional(),
});

export const updateFicheActionRequestSchema = updateFicheActionSchema.extend({
  // We're overriding piliersEci and cibles because,
  // for some unknown reason (a bug with zod/drizzle ?), extend() looses enum's array
  piliersEci: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.replace(/'/g, '’') : val),
      z.nativeEnum(ficheActionPiliersEciEnumType)
    )
    .array()
    .optional(),
  cibles: z.nativeEnum(FicheActionCiblesEnumType).array().optional(),
  // Overriding because numeric and timestamp types are not properly converted otherwise (a bug with zod/drizzle ?)
  budgetPrevisionnel: z
    .union([z.string(), z.number()])
    .transform((val) => val.toString())
    .refine((val) => !isNaN(Number(val)), {
      message: "Expected 'budgetPrevisionnel' to be a numeric string",
    })
    .optional(),
  dateDebut: z
    .string()
    .nullable()
    .refine((val) => val === null || !isNaN(Date.parse(val)), {
      message: "Invalid date format for 'dateDebut'",
    })
    .optional(),

  tempsDeMiseEnOeuvre: z
    .union([
      z.number(),
      z.object({
        id: z.number(),
        nom: z.string(),
      }),
    ])
    .transform((val) => (typeof val === 'number' ? val : val.id))
    .optional(),

  axes: axeSchema.pick({ id: true }).array().optional(),
  thematiques: thematiqueSchema.pick({ id: true }).array().optional(),
  sousThematiques: sousThematiqueSchema.pick({ id: true }).array().optional(),
  partenaires: partenaireTagSchema.pick({ id: true }).array().optional(),
  structures: structureTagSchema.pick({ id: true }).array().optional(),
  pilotes: piloteOrReferentSchema.array().optional(),
  referents: piloteOrReferentSchema.array().optional(),
  actions: actionRelationSchema.pick({ id: true }).array().optional(),
  indicateurs: indicateurDefinitionSchema.pick({ id: true }).array().optional(),
  services: serviceTagSchema.pick({ id: true }).array().optional(),
  financeurs: z.array(financeurWithMontantSchema).optional(),
  fichesLiees: ficheActionSchema.pick({ id: true }).array().optional(),
  resultatsAttendus: effetAttenduSchema.pick({ id: true }).array().optional(),
});

export type UpdateFicheActionRequestType = z.infer<
  typeof updateFicheActionRequestSchema
>;

export type UpdateFicheActionType = z.infer<typeof updateFicheActionSchema>;
