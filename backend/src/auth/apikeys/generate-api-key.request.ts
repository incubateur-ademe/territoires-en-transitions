import { PermissionOperations } from '@/backend/auth/index-domain';
import { z } from 'zod';

export const generateApiKeyRequestSchema = z.object({
  userId: z.string().uuid(),
  permissions: z.enum(PermissionOperations).array().nonempty().optional(),
});
export type GenerateApiKeyRequest = z.infer<typeof generateApiKeyRequestSchema>;
