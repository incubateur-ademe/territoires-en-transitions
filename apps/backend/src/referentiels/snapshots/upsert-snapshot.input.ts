import {
  referentielIdEnumSchema,
  snapshotJalonEnumSchema,
} from '@tet/domain/referentiels';
import z from 'zod';
import { collectiviteIdInputSchema } from '../../collectivites/collectivite-id.input';

export const upsertSnapshotInputSchema = z.object({
  ...collectiviteIdInputSchema.shape,

  referentielId: referentielIdEnumSchema,
  nom: z.string().optional(),
  ref: z.string().optional(),
  date: z.iso.date().optional(),
  jalon: snapshotJalonEnumSchema.optional(),
  auditId: z.number().int().optional(),
});

export type UpsertSnapshotInput = z.infer<typeof upsertSnapshotInputSchema>;
