import * as z from 'zod';
import { bibliothequeFichierSchema } from './bibliotheque-fichier.schema';
import { lienSchema } from './document-lien.schema';

export const fichierStockeSchema = z.object({
  ...bibliothequeFichierSchema.shape,
  bucketId: z.string(),
  filesize: z.number().nullable(),
});

export type FichierStocke = z.infer<typeof fichierStockeSchema>;

export const documentCollectiviteBaseSchema = z.object({
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

export const documentCollectiviteSchema = documentCollectiviteBaseSchema.and(
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('fichier'), fichier: fichierStockeSchema }),
    z.object({ type: z.literal('lien'), lien: lienSchema }),
    z.object({ type: z.literal('fichierManquant'), filename: z.string() }),
    z.object({ type: z.literal('nonRenseigne') }),
  ])
);

export type DocumentCollectivite = z.infer<typeof documentCollectiviteSchema>;
export type DocumentCollectiviteInput = z.input<
  typeof documentCollectiviteSchema
>;
