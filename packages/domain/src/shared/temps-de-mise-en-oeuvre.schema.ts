import z from 'zod';

export const tempsDeMiseEnOeuvreSchema = z.object({
  id: z.number(),
  nom: z.string(),
});

export type TempsDeMiseEnOeuvre = z.infer<
  typeof tempsDeMiseEnOeuvreSchema
>;

