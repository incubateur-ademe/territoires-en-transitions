import {z} from 'zod';
import {getQueryOptionsSchema} from '../../../shared/domain/query_options.schema';

import {filtreRessourceLieesSchema} from '../../../collectivites/shared/domain/filtre_ressource_liees.schema';
import {niveauPrioriteSchema, statutSchema} from './fiche_resumes.schema';

export const modifiedSinceSchema = z.enum([
  'last-90-days',
  'last-60-days',
  'last-30-days',
  'last-15-days',
]);

export type ModifiedSince = z.infer<typeof modifiedSinceSchema>;

export const filtreSpecifiqueSchema = z.object({
  statuts: statutSchema.array().optional(),
  priorites: niveauPrioriteSchema.array().optional(),
  modifiedSince: modifiedSinceSchema.optional(),
  texteNomOuDescription: z.string().optional(),
  budgetPrevisionnel: z.boolean().default(false).optional(),
  restreint: z.boolean().default(false).optional(),
  hasIndicateurLies: z.boolean().default(false).optional(),
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
    utilisateurReferentIds: true,
    personneReferenteIds: true,
    structurePiloteIds: true,
    servicePiloteIds: true,
    thematiqueIds: true,
    financeurIds: true,
  })
  .merge(filtreSpecifiqueSchema);

export type Filtre = z.infer<typeof filtreSchema>;

const sortValues = ['modified_at', 'created_at', 'titre'] as const;

export type SortFichesActionValue = (typeof sortValues)[number];

const sortFicheSchema = z.object({
  field: z.enum(sortValues),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export type SortFichesAction = z.infer<typeof sortFicheSchema>;

export const fetchOptionsSchema = getQueryOptionsSchema(sortValues).extend({
  filtre: filtreSchema,
});

export type FetchOptions = z.input<typeof fetchOptionsSchema>;