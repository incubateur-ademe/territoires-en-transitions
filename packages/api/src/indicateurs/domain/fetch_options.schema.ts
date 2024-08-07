import {z} from 'zod';
import {filtreRessourceLieesSchema} from '../../collectivites/shared/domain/filtre_ressource_liees.schema';
import {getQueryOptionsSchema} from '../../shared/domain/query_options.schema';

export const typeSchema = z.enum(['resultat', 'impact']);

export type TypeIndicateur = z.infer<typeof typeSchema>;

export const filtreSpecifiqueSchema = z.object({
  actionId: z.string().optional(),
  type: typeSchema.array().optional(),
  participationScore: z.boolean().optional(),
  estComplet: z.coerce.boolean().default(false).optional(),
  confidentiel: z.coerce.boolean().default(false).optional(),
  fichesNonClassees: z.coerce.boolean().default(false).optional(),
  text: z.string().optional(),
  isPerso: z.coerce.boolean().default(false).optional(),
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
  })
  .merge(filtreSpecifiqueSchema);

export type Filtre = z.infer<typeof filtreSchema>;

export const fetchOptionsSchema = getQueryOptionsSchema(['text']).extend({
  filtre: filtreSchema,
});

export type FetchOptions = z.infer<typeof fetchOptionsSchema>;
