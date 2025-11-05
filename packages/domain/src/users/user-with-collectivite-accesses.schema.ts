import { collectiviteAccessSchema, dcpSchema } from '@/domain/users';
import z from 'zod';
import * as zm from 'zod/mini';

export const UserWithCollectiviteAccessesSchema = z.object({
  ...zm.pick(dcpSchema, {
    nom: true,
    prenom: true,
    email: true,
    telephone: true,
    cguAccepteesLe: true,
  }).shape,

  id: z.string(),
  newEmail: z.string().optional().nullable(),
  isVerified: z.boolean(),
  isSupport: z.boolean(),
  collectivites: z.array(collectiviteAccessSchema),
});

export type UserWithCollectiviteAccesses = z.infer<
  typeof UserWithCollectiviteAccessesSchema
>;
