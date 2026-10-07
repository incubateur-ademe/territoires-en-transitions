import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import { actionIdSchema } from '@tet/domain/referentiels';
import z from 'zod';

export const downloadDocumentsMesureInputSchema =
  collectiviteIdInputSchemaCoerce.extend({
    actionId: actionIdSchema,
  });

export type DownloadDocumentsMesureInput = z.infer<
  typeof downloadDocumentsMesureInputSchema
>;
