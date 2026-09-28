import {
  indicateurPeriodiciteSchema,
  indicateurAggregationSchema,
} from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

// Migration release: keep every public writer annual until the activation PR.
// Refinements preserve the storage types used by the internal services.
export const annualReleasePeriodiciteSchema = indicateurPeriodiciteSchema.check(
  z.refine((value) => value === 'annuelle', {
    message: 'Seule la périodicité annuelle est disponible.',
  })
);

export const annualReleaseAggregationSchema = z
  .nullable(indicateurAggregationSchema)
  .check(
    z.refine((value) => value === null, {
      message: 'L’agrégation sera disponible avec les nouvelles périodicités.',
    })
  );
