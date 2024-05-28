import {z} from 'zod';
import {getQueryOptionsSchema} from '../../../shared/domain/query_options.schema';
import {niveauPrioritesSchema, statutsSchema} from './enum.schemas';

/**
 * Schema de filtre pour les fiches actions.
 */
export const filtreSchema = z.object({
  planActionIds: z.number().array().optional(),

  utilisateurPiloteIds: z.string().array().optional(),
  personnePiloteIds: z.number().array().optional(),
  structurePiloteIds: z.number().array().optional(),
  servicePiloteIds: z.number().array().optional(),

  statuts: statutsSchema.array().optional(),
  priorites: niveauPrioritesSchema.array().optional(),

  modifiedSince: z
    .enum(['last-90-days', 'last-60-days', 'last-30-days', 'last-15-days'])
    .optional(),
});

export type Filtre = z.infer<typeof filtreSchema>;

export const fetchOptionsSchema = getQueryOptionsSchema([
  'titre',
  'modified_at',
]).extend({
  filtre: filtreSchema,
});

export type Options = z.infer<typeof fetchOptionsSchema>;

/**
 * Schema de retour des valeurs associées aux ids des filtres.
 */
export const filtreValueSchema = z.object({
  planActions: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),

  utilisateurPilotes: z
    .object({
      userId: z.string(),
      nom: z.string(),
      prenom: z.string(),
    })
    .array()
    .optional(),

  personnePilotes: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),

  structurePilotes: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),

  servicePilotes: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),
});
