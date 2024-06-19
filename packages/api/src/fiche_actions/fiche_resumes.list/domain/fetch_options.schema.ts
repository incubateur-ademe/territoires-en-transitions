import {z} from 'zod';
import {getQueryOptionsSchema} from '../../../shared/domain/query_options.schema';

import {filtreRessourceLieesSchema} from '../../../collectivites/shared/domain/filtre_ressource_liees.schema';
import {niveauPrioriteSchema, statutSchema} from './fiche_resumes.schema';

export const filtreSpecifiqueSchema = z.object({
  statuts: statutSchema.array().optional(),
  priorites: niveauPrioriteSchema.array().optional(),

  modifiedSince: z
    .enum(['last-90-days', 'last-60-days', 'last-30-days', 'last-15-days'])
    .optional(),
});

export type FiltreSpecifique = z.infer<typeof filtreSpecifiqueSchema>;

/**
 * Schema de filtre pour le fetch des fiches actions.
 */
export const filtreSchema = filtreRessourceLieesSchema
  .pick({
    planActionIds: true,
    utilisateurPiloteIds: true,
    personnePiloteIds: true,
    structurePiloteIds: true,
    servicePiloteIds: true,
  })
  .merge(filtreSpecifiqueSchema);

export type Filtre = z.infer<typeof filtreSchema>;

export const fetchOptionsSchema = getQueryOptionsSchema([
  'titre',
  'modified_at',
]).extend({
  filtre: filtreSchema,
});

export type FetchOptions = z.input<typeof fetchOptionsSchema>;
