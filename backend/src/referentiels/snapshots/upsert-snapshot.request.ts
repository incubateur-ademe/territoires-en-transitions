import z from 'zod';
import { collectiviteRequestSchema } from '../../collectivites/collectivite.request';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';

export const upsertSnapshotRequestSchema = collectiviteRequestSchema.extend({
  referentielId: referentielIdEnumSchema,
  snapshotNom: z.string(),
  date: z.string().datetime().optional(),
});
