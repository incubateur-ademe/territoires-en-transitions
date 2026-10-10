import * as z from 'zod/mini';

// The public contract and its generated documentation expose only annual writes.
export const annualReleasePeriodiciteSchema = z.literal('annuelle', {
  error: 'Seule la périodicité annuelle est disponible.',
});
