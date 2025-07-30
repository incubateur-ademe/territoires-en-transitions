import { referentielIdEnumSchema } from '@/backend/referentiels/models/referentiel-id.enum';
import { snapshotJalonEnumSchema } from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import { snapshotWithoutPayloadsSchema } from '@/backend/referentiels/snapshots/snapshot.table';
import z from 'zod';

export const listSnapshotsApiResponseSchema = z.object({
  collectiviteId: z.number().int(),
  referentielId: referentielIdEnumSchema,
  jalons: snapshotJalonEnumSchema.array(),
  snapshots: snapshotWithoutPayloadsSchema.array(),
});

export type ListSnapshotsApiResponse = z.infer<
  typeof listSnapshotsApiResponseSchema
>;
