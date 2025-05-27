import { referentielIdEnumSchema } from '@/backend/referentiels/index-domain';
import z from 'zod';

export const listSnapshotsApiParamsSchema = z.object({
  referentielId: referentielIdEnumSchema,
  collectiviteId: z.coerce.number().int(),
});

export type ListSnapshotsApiParams = z.infer<
  typeof listSnapshotsApiParamsSchema
>;
