import * as z from 'zod/mini';

export const dcpSchema = z.object({
  userId: z.uuid(),
  nom: z.string(),
  prenom: z.string(),
  email: z.string(),
  limited: z.boolean(),
  deleted: z.boolean(),
  createdAt: z.nullable(z.string()),
  modifiedAt: z.nullable(z.string()),
  telephone: z.nullable(z.string()),
  cguAccepteesLe: z.nullable(z.string()),
});

export type Dcp = z.infer<typeof dcpSchema>;
