import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const countSyntheseValeurSchema = extendApi(
  z.object({
    count: z.number().int(),
    valeur: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  })
);
export type CountSyntheseValeurType = z.infer<typeof countSyntheseValeurSchema>;

export const countSyntheseSchema = extendApi(
  z.record(z.string(), countSyntheseValeurSchema)
);
export type CountSyntheseType = z.infer<typeof countSyntheseSchema>;
