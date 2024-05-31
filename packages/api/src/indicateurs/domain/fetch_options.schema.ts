import {z} from 'zod';
import {filtreRessourceLieesSchema} from '../../collectivites/shared/domain/filtre_ressource_liees.schema';
import {getQueryOptionsSchema} from '../../shared/domain/query_options.schema';

export const filtreSpecifiqueSchema = z.object({
    estComplet: z.boolean().optional(),
});

export type FiltreSpecifique = z.infer<typeof filtreSpecifiqueSchema>;


/**
 * Schema de filtre pour le fetch des indicateurs.
 */
export const filtreSchema = filtreRessourceLieesSchema
  .pick({
    planActionIds: true,
    utilisateurPiloteIds: true,
    personnePiloteIds: true,
    servicePiloteIds: true,
    thematiqueIds: true,
  })
    .merge(filtreSpecifiqueSchema);

export type Filtre = z.infer<typeof filtreSchema>;

export const fetchOptionsSchema = getQueryOptionsSchema(['text']).extend({
  filtre: filtreSchema,
});

export type FetchOptions = z.infer<typeof fetchOptionsSchema>;
