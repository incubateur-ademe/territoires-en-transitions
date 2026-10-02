import { z } from 'zod';
import { listDefinitionsInputFiltersSchema } from '../definitions/list-definitions.input';

// Reject unsupported persisted criteria instead of silently broadening a vue.
export const indicateurVueFiltersSchema = z.strictObject(
  listDefinitionsInputFiltersSchema.shape
);

export type IndicateurVueFilters = z.infer<typeof indicateurVueFiltersSchema>;
