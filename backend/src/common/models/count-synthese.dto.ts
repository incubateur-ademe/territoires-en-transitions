import { z } from 'zod';

export const countSyntheseValeurSchema = z.object({
  count: z.number().int(),
  valeur: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

export type CountSyntheseValeurType = z.infer<typeof countSyntheseValeurSchema>;

export const countByRecordSchema = z.record(
  z.string(),
  countSyntheseValeurSchema
);

export type CountByRecordType<Value> = Record<
  string,
  { count: number; valeur: Value }
>;
