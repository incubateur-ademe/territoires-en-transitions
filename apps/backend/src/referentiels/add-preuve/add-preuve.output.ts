import z from 'zod';

export const addPreuveOutputSchema = z.object({
  id: z.number().int().positive(),
});

export type AddPreuveOutput = z.infer<typeof addPreuveOutputSchema>;