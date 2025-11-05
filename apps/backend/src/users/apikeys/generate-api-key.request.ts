import { PermissionOperations } from '@/domain/users';
import { z } from 'zod';

export const generateApiKeyRequestSchema = z.object({
  userId: z.uuid(),
  permissions: z.enum(PermissionOperations).array().optional(),
});
export type GenerateApiKeyRequest = z.infer<typeof generateApiKeyRequestSchema>;
