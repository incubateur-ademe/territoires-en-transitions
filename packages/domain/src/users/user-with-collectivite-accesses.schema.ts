import z from 'zod';
import * as zm from 'zod/mini';
import { collectiviteAccessSchema } from './authorizations/collectivite-access-level.schema';
import { dcpSchema } from './dcp.schema';

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
  isSupportModeEnabled: z.boolean(),
  collectivites: z.array(collectiviteAccessSchema),
});

export type UserWithCollectiviteAccesses = z.infer<
  typeof UserWithCollectiviteAccessesSchema
>;
