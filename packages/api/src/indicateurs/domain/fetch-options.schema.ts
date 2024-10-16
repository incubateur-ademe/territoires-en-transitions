import { z } from 'zod';
import { filtreRessourceLieesSchema } from '../../collectivites/shared/domain/filtre-ressource-liees.schema';
import { getQueryOptionsSchema } from '../../shared/domain/query_options.schema';
import { categorieSchema } from './categorie.schema';

export const filtreSpecifiqueSchema = z.object({
  actionId: z.string().optional(),
  participationScore: z.boolean().optional(),
  estComplet: z.coerce.boolean().default(false).optional(),
  estConfidentiel: z.coerce.boolean().default(false).optional(),
  estFavorisCollectivite: z.coerce.boolean().default(false).optional(),
  fichesNonClassees: z.coerce.boolean().default(false).optional(),
  text: z.string().optional(),
  estPerso: z.coerce.boolean().default(false).optional(),
  categorieNoms: z.array(categorieSchema.shape.nom).optional(),
  hasOpenData: z.coerce.boolean().optional(),
});

export type FiltreSpecifique = z.infer<typeof filtreSpecifiqueSchema>;

/**
 * Schema de filtre pour le fetch des indicateurs.
 */
export const filtreSchema = filtreRessourceLieesSchema
  .pick({
    thematiqueIds: true,
    planActionIds: true,
    utilisateurPiloteIds: true,
    personnePiloteIds: true,
    servicePiloteIds: true,
    ficheActionIds: true,
  })
  .merge(filtreSpecifiqueSchema);

export type FetchFiltre = z.infer<typeof filtreSchema>;

export const fetchOptionsSchema = getQueryOptionsSchema([
  'text',
  'estComplet',
]).extend({
  filtre: filtreSchema.optional(),
});

export type FetchOptions = z.input<typeof fetchOptionsSchema>;
