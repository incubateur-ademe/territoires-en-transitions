import * as z from 'zod/mini';

export const regleTypeEnumValues = [
  'score',
  'desactivation',
  'reduction',
] as const;
export const regleTypeEnumSchema = z.enum(regleTypeEnumValues);

export const personnalisationRegleSchema = z.object({
  actionId: z.string(),
  type: regleTypeEnumSchema,
  formule: z.string(),
  description: z.string(),
  modifiedAt: z.iso.datetime(),
});

export type PersonnalisationRegle = z.infer<typeof personnalisationRegleSchema>;

export const personnalisationRegleCreateSchema = z.pick(
  personnalisationRegleSchema,
  {
    actionId: true,
    type: true,
    formule: true,
    description: true,
  }
);

export type PersonnalisationRegleCreate = z.infer<
  typeof personnalisationRegleCreateSchema
>;
