import {
  bibliothequeFichierSchema,
  UploadDecisionKindEnum,
} from '@tet/domain/collectivites';
import * as z from 'zod';

export const createUploadTokenOutputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(UploadDecisionKindEnum.ALREADY_IN_BIBLIOTHEQUE),
    fichierId: z.number().int().positive(),
    filename: bibliothequeFichierSchema.shape.filename,
  }),
  z.object({
    kind: z.literal(UploadDecisionKindEnum.ALREADY_IN_STORAGE),
  }),
  z.object({
    kind: z.literal(UploadDecisionKindEnum.READY_TO_UPLOAD),
    token: z.string().min(1),
    bucketId: z.string().min(1),
    path: z.string().min(1),
  }),
]);

export type CreateUploadTokenOutput = z.infer<
  typeof createUploadTokenOutputSchema
>;
