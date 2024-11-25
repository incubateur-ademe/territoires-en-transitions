import z from 'zod';
import { indicateurDefinitionSchema } from '../../indicateurs/models/indicateur-definition.table';
import { actionRelationSchema } from '../../referentiels/models/action-relation.table';
import { effetAttenduSchema } from '../../taxonomie/models/effet-attendu.table';
import { financeurTagSchema } from '../../taxonomie/models/financeur-tag.table';
import { libreTagSchema } from '../../taxonomie/models/libre-tag.table';
import { partenaireTagSchema } from '../../taxonomie/models/partenaire-tag.table';
import { serviceTagSchema } from '../../taxonomie/models/service-tag.table';
import { sousThematiqueSchema } from '../../taxonomie/models/sous-thematique.table';
import { structureTagSchema } from '../../taxonomie/models/structure-tag.table';
import { thematiqueSchema } from '../../taxonomie/models/thematique.table';
import { axeSchema } from './axe.table';
import {
  FicheActionCiblesEnumType,
  ficheActionSchema,
  piliersEciEnumType,
  updateFicheActionSchema,
} from './fiche-action.table';

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

export const updateFicheActionRequestSchema = updateFicheActionSchema
  .extend({
    // We're overriding piliersEci and cibles because,
    // for some unknown reason (a bug with zod/drizzle ?), extend() looses enum's array
    piliersEci: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.replace(/'/g, '’') : val),
        z.nativeEnum(piliersEciEnumType)
      )
      .array()
      .nullish(),
    cibles: z.nativeEnum(FicheActionCiblesEnumType).array().nullish(),
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
    indicateurs: indicateurDefinitionSchema
      .pick({ id: true })
      .array()
      .nullish(),
    services: serviceTagSchema.pick({ id: true }).array().nullish(),
    financeurs: z.array(financeurWithMontantSchema).nullish(),
    fichesLiees: ficheActionSchema.pick({ id: true }).array().nullish(),
    resultatsAttendus: effetAttenduSchema.pick({ id: true }).array().nullish(),
    libresTag: z
      .array(
        z
          .object({
            id: z.number().optional(),
            nom: z.string().min(1).optional(),
            createdBy: z.string().uuid().optional(),
          })
          .refine(
            (data) => data.id !== undefined || data.nom !== undefined,
            'Either id or nom must be provided'
          )
      )
      .nullish(),
  })
  .refine((schema) => Object.keys(schema).length > 0, 'Body cannot be empty');

export type UpdateFicheActionRequestType = z.infer<
  typeof updateFicheActionRequestSchema
>;

export type UpdateFicheActionType = z.infer<typeof updateFicheActionSchema>;
