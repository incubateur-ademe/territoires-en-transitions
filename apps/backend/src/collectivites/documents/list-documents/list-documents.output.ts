import { bibliothequeFichierSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

export const listDocumentsOutputItemSchema = bibliothequeFichierSchema.extend({
  bucketId: z.string().uuid(),
  fileId: z.string().uuid(),
  filesize: z.number().int().nullable(),
});

export type ListDocumentsOutputItem = z.infer<
  typeof listDocumentsOutputItemSchema
>;

export const listDocumentsOutputSchema = z.object({
  count: z.number().int(),
  pageCount: z.number().int(),
  pageSize: z.number().int(),
  page: z.number().int(),
  data: listDocumentsOutputItemSchema.array(),
});

export type ListDocumentsOutput = z.infer<typeof listDocumentsOutputSchema>;
