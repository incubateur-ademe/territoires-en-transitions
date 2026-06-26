import { personneIdSchema } from '@tet/domain/collectivites';
import { z } from 'zod';
import {
  baseCreateAxeOrPlanSchema,
  baseUpdateAxeOrPlanSchema,
} from '../../axes/upsert-axe/upsert-axe-base.input';

/**
 * Champs de dates optionnelles d'un plan (date_debut / date_fin).
 * Format attendu : `YYYY-MM-DD` (date sans heure).
 */
export const planDatesSchema = {
  dateDebut: z.string().date().nullish(),
  dateFin: z.string().date().nullish(),
};

/**
 * Validation croisée des dates : `dateFin >= dateDebut` uniquement quand les
 * deux dates sont renseignées. Les dates sont au format `YYYY-MM-DD`, donc la
 * comparaison lexicographique est équivalente à la comparaison chronologique.
 */
export const refinePlanDates = (
  data: { dateDebut?: string | null; dateFin?: string | null },
  ctx: z.RefinementCtx
) => {
  if (data.dateDebut && data.dateFin && data.dateFin < data.dateDebut) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dateFin'],
      message: 'La date de fin doit être postérieure ou égale à la date de début',
    });
  }
};

/**
 * Schéma pour créer un plan
 */
export const baseCreatePlanSchema = z.object({
  ...baseCreateAxeOrPlanSchema.shape,
  typeId: z.number().optional(),
  ...planDatesSchema,
});
export type BaseCreatePlanInput = z.infer<typeof baseCreatePlanSchema>;

/**
 * Schéma pour mettre à jour un plan
 */
export const baseUpdatePlanSchema = z.object({
  ...baseUpdateAxeOrPlanSchema.shape,
  typeId: z.number().nullish(),
  ...planDatesSchema,
});
export type BaseUpdatePlanInput = z.infer<typeof baseUpdatePlanSchema>;

/**
 * Options supplémentaires pour upsert (referents et pilotes)
 */
const upsertPlanOptionsSchema = z.object({
  referents: z.array(personneIdSchema).nullish(),
  pilotes: z.array(personneIdSchema).nullish(),
});

/**
 * Schéma pour upsert (create ou update avec options)
 */
export const updatePlanSchema = baseUpdatePlanSchema
  .extend(upsertPlanOptionsSchema.shape)
  .superRefine(refinePlanDates);
export type UpdatePlan = z.infer<typeof updatePlanSchema>;

export const createPlanSchema = baseCreatePlanSchema
  .extend(upsertPlanOptionsSchema.shape)
  .superRefine(refinePlanDates);
export type CreatePlan = z.infer<typeof createPlanSchema>;

export const upsertPlanSchema = z.union([updatePlanSchema, createPlanSchema]);
export type UpsertPlanInput = z.infer<typeof upsertPlanSchema>;
