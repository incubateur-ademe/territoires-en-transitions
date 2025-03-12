import { z } from 'zod';

export const personnalisationReponsesPayloadSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .describe('Reponses aux questions de personnalisation');

export type PersonnalisationReponsesPayload = z.infer<
  typeof personnalisationReponsesPayloadSchema
>;
