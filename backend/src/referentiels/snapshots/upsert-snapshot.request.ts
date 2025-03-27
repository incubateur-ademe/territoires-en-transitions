import z from 'zod';
import { collectiviteRequestSchema } from '../../collectivites/collectivite.request';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import { snapshotJalonEnumSchema } from './snapshot-jalon.enum';

export const upsertSnapshotRequestSchema = collectiviteRequestSchema.extend({
  referentielId: referentielIdEnumSchema,
  nom: z.string().optional(),
  ref: z.string().optional(),
  date: z.string().datetime().optional(),
  jalon: snapshotJalonEnumSchema.optional(),
  auditId: z.number().int().optional(),
});

export type UpsertSnapshotRequest = z.infer<typeof upsertSnapshotRequestSchema>;
