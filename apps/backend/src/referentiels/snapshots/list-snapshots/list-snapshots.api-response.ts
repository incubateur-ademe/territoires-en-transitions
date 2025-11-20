import {
  referentielIdEnumSchema,
  snapshotJalonEnumSchema,
  snapshotWithoutPayloadsSchema,
} from '@tet/domain/referentiels';
import z from 'zod';

export const listSnapshotsApiResponseSchema = z.object({
  collectiviteId: z.number().int(),
  referentielId: referentielIdEnumSchema,
  jalons: snapshotJalonEnumSchema.array(),
  snapshots: z.array(snapshotWithoutPayloadsSchema),
});

export type ListSnapshotsApiResponse = z.infer<
  typeof listSnapshotsApiResponseSchema
>;
