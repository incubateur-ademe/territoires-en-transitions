import z from 'zod';

export const idNameSchema = z
  .object({
    id: z.number(),
    nom: z.string(),
  })
  .describe(
    'Simple schema avec un id et un nom utilisé pour des relations entre entités'
  );

export type IdNameSchema = z.infer<typeof idNameSchema>;
