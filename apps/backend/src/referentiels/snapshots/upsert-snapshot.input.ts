import z from 'zod';
import { collectiviteIdInputSchema } from '../../collectivites/collectivite-id.input';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import { snapshotJalonEnumSchema } from './snapshot-jalon.enum';

export const upsertSnapshotInputSchema = z.object({
  ...collectiviteIdInputSchema.shape,

  referentielId: referentielIdEnumSchema,
  nom: z.string().optional(),
  ref: z.string().optional(),
  date: z.iso.datetime().optional(),
  jalon: snapshotJalonEnumSchema.optional(),
  auditId: z.number().int().optional(),
});

export type UpsertSnapshotInput = z.infer<typeof upsertSnapshotInputSchema>;
