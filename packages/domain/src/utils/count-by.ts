import { z } from 'zod';

export const countSyntheseValeurSchema = z.object({
  count: z.number().int(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  label: z.string().optional(),
  color: z.string().optional(),
});

export type CountSyntheseValeurType = z.infer<typeof countSyntheseValeurSchema>;

export const countByRecordSchema = z.record(
  z.string(),
  countSyntheseValeurSchema
);

export type CountByRecordGeneralType = z.infer<typeof countByRecordSchema>;

export type CountByRecordType<Value> = Record<
  string,
  { count: number; value: Value; label?: string; color?: string }
>;

export const countByResponseSchema = z.object({
  countByProperty: z.string(),
  total: z.number().int(),
  countByResult: countByRecordSchema,
});

export type CountByResponseType = z.infer<typeof countByResponseSchema>;

export const countByForEntityResponseSchema = countByResponseSchema.extend({
  id: z.number(),
  nom: z.string(),
});

export type CountByForEntityResponseType = z.infer<
  typeof countByForEntityResponseSchema
>;
