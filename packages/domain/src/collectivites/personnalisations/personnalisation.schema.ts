import * as z from 'zod/mini';

export const personnalisationSchema = z.object({
  actionId: z.string(),
  titre: z.string(),
  description: z.string(),
});

export type Personnalisation = z.infer<typeof personnalisationSchema>;
