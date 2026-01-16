import z from 'zod';
import * as zm from 'zod/mini';
import { dcpSchema } from './dcp.schema';

export const userInfoSchema = z.object({
  ...zm.pick(dcpSchema, {
    nom: true,
    prenom: true,
    email: true,
    telephone: true,
    cguAccepteesLe: true,
  }).shape,

  id: z.string(),
  newEmail: z.string().optional().nullable(),
  // isVerified: z.boolean(),
  // isSupport: z.boolean(),
  // isSuperAdminRoleEnabled: z.boolean(),
});

export type UserInfo = z.infer<typeof userInfoSchema>;
