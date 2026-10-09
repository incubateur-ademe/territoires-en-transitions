import {
  referentielIdEnumSchema,
  SnapshotJalon,
  SnapshotJalonEnum,
  snapshotJalonEnumSchema,
} from '@tet/domain/referentiels';
import z from 'zod';
import { collectiviteIdInputSchema } from '../../collectivites/collectivite-id.input';

// Produits par la plateforme (audit, labellisation) : l'interface les présente
// comme des sauvegardes automatiques.
const AUTOMATIC_JALONS: SnapshotJalon[] = [
  SnapshotJalonEnum.PRE_AUDIT,
  SnapshotJalonEnum.POST_AUDIT,
  SnapshotJalonEnum.LABELLISATION_EMT,
];

export const upsertSnapshotInputSchema = z.object({
  ...collectiviteIdInputSchema.shape,

  referentielId: referentielIdEnumSchema,
  nom: z.string().optional(),
  ref: z.string().optional(),
  date: z.iso.date().optional(),
  jalon: snapshotJalonEnumSchema
    .optional()
    .refine((jalon) => !jalon || !AUTOMATIC_JALONS.includes(jalon), {
      message:
        'Les jalons avant audit, après audit et labellisation sont réservés aux sauvegardes automatiques',
    }),
  auditId: z.number().int().optional(),
});

export type UpsertSnapshotInput = z.infer<typeof upsertSnapshotInputSchema>;
