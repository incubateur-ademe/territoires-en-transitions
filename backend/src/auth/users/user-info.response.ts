import z from 'zod';
import { dcpSchema, utilisateurPermissionSchema } from '../index-domain';

export const userInfoResponseSchema = dcpSchema
  .pick({
    userId: true,
    nom: true,
    prenom: true,
    email: true,
    telephone: true,
  })
  .extend({
    isVerified: z.boolean().optional().nullable(),
    isSupport: z.boolean().optional().nullable(),
    permissions: utilisateurPermissionSchema
      .pick({
        collectiviteId: true,
        isActive: true,
        niveau: true,
      })
      .array()
      .optional(),
  });

export type UserInfoResponseType = z.infer<typeof userInfoResponseSchema>;
