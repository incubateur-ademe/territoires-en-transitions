import {
  SnapshotJalonEnum,
  snapshotJalonEnumSchema,
} from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import z from 'zod';

export const LIST_DEFAULT_JALONS = [
  SnapshotJalonEnum.PRE_AUDIT,
  SnapshotJalonEnum.POST_AUDIT,
  SnapshotJalonEnum.DATE_PERSONNALISEE,
  SnapshotJalonEnum.LABELLISATION_EMT,
  SnapshotJalonEnum.COURANT,
];

export const listSnapshotsApiQuerySchema = z
  .object({
    jalons: z
      .string()
      .transform((value) => value.split(','))
      .pipe(z.array(snapshotJalonEnumSchema))
      .optional()
      .default(LIST_DEFAULT_JALONS),
  })
  .optional()
  .default({
    jalons: LIST_DEFAULT_JALONS,
  });

export type ListSnapshotsApiQuery = z.infer<typeof listSnapshotsApiQuerySchema>;
