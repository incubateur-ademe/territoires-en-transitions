import * as z from 'zod/mini';
import { annexeSchema, fichierSchema, lienSchema } from '../../collectivites';

export const annexeDocumentCommonSchema = z.object({
  id: annexeSchema.shape.id,
  collectiviteId: annexeSchema.shape.collectiviteId,
  ficheId: annexeSchema.shape.ficheId,
  commentaire: annexeSchema.shape.commentaire,
  modifiedAt: annexeSchema.shape.modifiedAt,
  modifiedByNom: z.nullable(z.string()),
});

const annexeWithFileSchema = z.object({
  ...annexeDocumentCommonSchema.shape,
  fichier: fichierSchema,
  lien: z.null(),
});

const annexeWithLinkSchema = z.object({
  ...annexeDocumentCommonSchema.shape,
  fichier: z.null(),
  lien: lienSchema,
});

export const annexeDocumentSchema = z.union([
  annexeWithFileSchema,
  annexeWithLinkSchema,
]);

export type AnnexeDocument = z.infer<typeof annexeDocumentSchema>;
