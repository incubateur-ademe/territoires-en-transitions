import {
  ciblesEnumSchema,
  prioriteEnumSchema,
  statutsEnumSchema,
} from '@/domain/plans/fiches';
import { getPaginationSchema } from '@/domain/utils';
import { z } from 'zod';
import { filtreRessourceLieesSchema } from '../../../collectivites/shared/domain/filtre-ressource-liees.schema';

export const modifiedSinceSchema = z.enum([
  'last-90-days',
  'last-60-days',
  'last-30-days',
  'last-15-days',
]);

export type ModifiedSince = z.infer<typeof modifiedSinceSchema>;

export const filtreSpecifiqueSchema = z.object({
  statuts: statutsEnumSchema.array().optional(),
  priorites: prioriteEnumSchema.array().optional(),
  cibles: ciblesEnumSchema.array().optional(),
  modifiedSince: modifiedSinceSchema.optional(),
  texteNomOuDescription: z.string().optional(),
  budgetPrevisionnel: z.coerce.boolean().default(false).optional(),
  restreint: z.coerce.boolean().default(false).optional(),
  hasIndicateurLies: z.coerce.boolean().default(false).optional(),
  noPilote: z.coerce.boolean().default(false).optional(),
  noServicePilote: z.coerce.boolean().default(false).optional(),
  noStatut: z.coerce.boolean().default(false).optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  ameliorationContinue: z.coerce.boolean().default(false).optional(),
  typePeriode: z.enum(['creation', 'modification', 'debut', 'fin']).optional(),
  debutPeriode: z.string().optional(),
  finPeriode: z.string().optional(),
});

export type FiltreSpecifique = z.infer<typeof filtreSpecifiqueSchema>;

/**
 * Schema de filtre pour le fetch des fiches actions.
 */
export const filtreSchema = filtreRessourceLieesSchema
  .pick({
    ficheActionIds: true,
    planActionIds: true,
    referentielActionIds: true,
    linkedFicheActionIds: true,
    utilisateurPiloteIds: true,
    personnePiloteIds: true,
    utilisateurReferentIds: true,
    partenaireIds: true,
    personneReferenteIds: true,
    structurePiloteIds: true,
    servicePiloteIds: true,
    libreTagsIds: true,
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

export const fetchOptionsSchema = getPaginationSchema(sortValues).extend({
  filtre: filtreSchema,
});

export type FetchOptions = z.input<typeof fetchOptionsSchema>;
