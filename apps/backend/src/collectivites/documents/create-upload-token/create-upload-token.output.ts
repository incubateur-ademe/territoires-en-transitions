import * as z from 'zod';

export const createUploadTokenOutputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('alreadyInBibliotheque'),
    fichierId: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal('readyToUpload'),
    token: z.string().min(1),
    bucketId: z.string().min(1),
    path: z.string().min(1),
  }),
]);

export type CreateUploadTokenOutput = z.infer<
  typeof createUploadTokenOutputSchema
>;
