import * as z from 'zod/mini';
import { collectiviteRoleSchema } from '../../users/authorizations/user-role.enum.schema';

export const invitationSchema = z.object({
  id: z.uuid(),
  role: collectiviteRoleSchema,
  email: z.string(),
});

export type Invitation = z.infer<typeof invitationSchema>;
