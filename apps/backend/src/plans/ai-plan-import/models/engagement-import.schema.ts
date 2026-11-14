import { engagementCibleSchema, engagementSchema } from '@tet/domain/plans';
import { z } from 'zod';
import { importSourceSchema } from './import-source.schema';

/** Le transport d'import ajoute la localisation documentaire au contrat métier. */
export const engagementCibleImportSchema = z.strictObject({
  ...engagementCibleSchema.shape,
  source: importSourceSchema,
});

export const engagementImportSchema = z.strictObject({
  ...engagementSchema.shape,
  source: importSourceSchema,
  cibles: z.array(engagementCibleImportSchema),
});

export type EngagementCibleImport = z.infer<typeof engagementCibleImportSchema>;
export type EngagementImport = z.infer<typeof engagementImportSchema>;
