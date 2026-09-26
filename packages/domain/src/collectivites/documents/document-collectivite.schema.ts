import * as z from 'zod';
import { bibliothequeFichierSchema } from './bibliotheque-fichier.schema';
import { lienSchema } from './document-lien.schema';

export const storedFileSchema = z.object({
  ...bibliothequeFichierSchema.shape,
  bucketId: z.string(),
  filesize: z.number().nullable(),
});

export type StoredFile = z.infer<typeof storedFileSchema>;

const documentCollectiviteBaseSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  commentaire: z.string().nullable(),
  modifiedAt: z.string().nullable(),
  modifiedBy: z.string().nullable(),
  modifiedByNom: z.string().nullable(),
});

export type DocumentCollectiviteBase = z.infer<
  typeof documentCollectiviteBaseSchema
>;

export const notApplicable = z.optional(z.never());

export const fichierSupportSchema = z.object({
  type: z.literal('fichier'),
  fichier: storedFileSchema,
  lien: notApplicable,
  filename: notApplicable,
});

export const lienSupportSchema = z.object({
  type: z.literal('lien'),
  lien: lienSchema,
  fichier: notApplicable,
  filename: notApplicable,
});

export const fichierManquantSupportSchema = z.object({
  type: z.literal('fichierManquant'),
  filename: z.string(),
  fichier: notApplicable,
  lien: notApplicable,
});

const nonRenseigneSupportSchema = z.object({
  type: z.literal('nonRenseigne'),
  fichier: notApplicable,
  lien: notApplicable,
  filename: notApplicable,
});

export const documentSupportSchema = z.discriminatedUnion('type', [
  fichierSupportSchema,
  lienSupportSchema,
  fichierManquantSupportSchema,
  nonRenseigneSupportSchema,
]);

export type DocumentSupport = z.infer<typeof documentSupportSchema>;

export type DocumentSupportRenseigne = Exclude<
  DocumentSupport,
  { type: 'nonRenseigne' }
>;

export const documentCollectiviteSchema = documentCollectiviteBaseSchema.and(
  documentSupportSchema
);

export type DocumentCollectivite = z.infer<typeof documentCollectiviteSchema>;
