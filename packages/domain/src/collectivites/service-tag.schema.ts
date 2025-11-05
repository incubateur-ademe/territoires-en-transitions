import * as z from 'zod/mini';

export const serviceTagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
});

export type ServiceTag = z.infer<typeof serviceTagSchema>;

export const serviceTagCreateSchema = z.partial(serviceTagSchema, {
  id: true,
});

export type ServiceTagCreate = z.infer<typeof serviceTagCreateSchema>;
