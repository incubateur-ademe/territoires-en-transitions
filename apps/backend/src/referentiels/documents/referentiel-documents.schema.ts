import {
  fichierManquantSupportSchema,
  fichierSupportSchema,
  lienSupportSchema,
} from '@tet/domain/collectivites';
import z from 'zod';

export const supportSchema = z.discriminatedUnion('type', [
  fichierSupportSchema,
  lienSupportSchema,
  fichierManquantSupportSchema,
]);

export const documentBaseSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  commentaire: z.string().nullable(),
  modifiedAt: z.string(),
  modifiedBy: z.string().nullable(),
  modifiedByNom: z.string().nullable(),
});
