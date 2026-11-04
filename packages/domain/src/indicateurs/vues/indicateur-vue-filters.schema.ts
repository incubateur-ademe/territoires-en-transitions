import { z } from 'zod';
import { listIndicateursInputFiltersSchema } from '../indicateur/list-indicateurs.input';

// Reject unsupported persisted criteria instead of silently broadening a vue.
export const indicateurVueFiltersSchema = z.strictObject(
  listIndicateursInputFiltersSchema.shape
);

export type IndicateurVueFilters = z.infer<typeof indicateurVueFiltersSchema>;
