import { z } from 'zod';

export const countSyntheseValeurSchema = z.object({
  count: z.number().int(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  label: z.string().optional(),
});

export type CountSyntheseValeurType = z.infer<typeof countSyntheseValeurSchema>;

export const countByRecordSchema = z.record(
  z.string(),
  countSyntheseValeurSchema
);

export type CountByRecordGeneralType = z.infer<typeof countByRecordSchema>;

export type CountByRecordType<Value> = Record<
  string,
  { count: number; value: Value; label?: string }
>;

export const countByResponseSchema = z.object({
  countByProperty: z.string(),
  total: z.number().int(), // Total count of records, can be inferior to the sum of counts in the result in case a record is counted multiple times
  countByResult: countByRecordSchema,
});

export type CountByResponseType = z.infer<typeof countByResponseSchema>;
