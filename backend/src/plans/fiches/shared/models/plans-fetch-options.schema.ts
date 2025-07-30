import { getPaginationSchema } from '@/backend/utils/pagination.schema';
import { filtreRessourceLieesSchema } from './filtre-ressource-liees.schema';

/**
 * Schema de filtre pour le fetch des plan actions.
 */
export const fetchFilterSchema = filtreRessourceLieesSchema.pick({
  planActionIds: true,
  utilisateurPiloteIds: true,
  personnePiloteIds: true,
});

const sortValues = ['nom', 'created_at'] as const;
export const plansFetchOptionsSchema = getPaginationSchema(sortValues).extend({
  filtre: fetchFilterSchema.optional(),
});
