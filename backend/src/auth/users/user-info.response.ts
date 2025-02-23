import z from 'zod';
import { dcpSchema, utilisateurDroitSchema } from '../index-domain';

export const userInfoResponseSchema = dcpSchema
  .pick({
    userId: true,
    nom: true,
    prenom: true,
    email: true,
    telephone: true,
  })
  .extend({
    verifie: z.boolean().optional().nullable(),
    support: z.boolean().optional().nullable(),
    droits: utilisateurDroitSchema
      .pick({
        collectiviteId: true,
        active: true,
        niveauAcces: true,
      })
      .array()
      .optional(),
  });

export type UserInfoResponseType = z.infer<typeof userInfoResponseSchema>;
