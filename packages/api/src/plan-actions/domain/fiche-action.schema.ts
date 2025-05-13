import { personneSchema } from '@/api/collectivites';
import { indicateurListItemSchema } from '@/api/indicateurs/domain';
import { actionSchema } from '@/api/referentiel';
import { authorSchema } from '@/domain/auth';
import { tagSchema } from '@/domain/collectivites';
import {
  axeSchema,
  ciblesEnumSchema,
  financeurSchemaUpdate,
  participationCitoyenneEnumSchema,
  prioriteEnumSchema,
  statutsEnumSchema,
} from '@/domain/plans/fiches';
import {
  effetAttenduSchema,
  sousThematiqueSchema,
  tempsDeMiseEnOeuvreSchema,
  thematiqueSchema,
} from '@/domain/shared';
import { z } from 'zod';

export const ficheActionSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  modifiedAt: z.string().datetime(),
  createdAt: z.string().datetime().nullish(),
  createdBy: authorSchema.nullable(),
  modifiedBy: authorSchema.nullable(),
  titre: z.string().nullable(),
  description: z.string().nullable(),
  statut: statutsEnumSchema.nullable(),
  ameliorationContinue: z.boolean().nullable(),
  dateFin: z
    .string()
    .date()
    .or(z.string().datetime({ offset: true }))
    .nullable(),
  priorite: prioriteEnumSchema.nullable(),
  cibles: ciblesEnumSchema.array().nullable(),
  restreint: z.boolean().nullable(),
  resultatsAttendus: effetAttenduSchema.array().nullable(),
  objectifs: z.string().nullable(),
  budgetPrevisionnel: z.number().nullable(),
  calendrier: z.string().nullable(),
  ressources: z.string().nullish(),
  notesComplementaires: z.string().nullish(),
  dateDebut: z
    .string()
    .date()
    .or(z.string().datetime({ offset: true }))
    .nullish(),
  financements: z.string().nullish(),
  instanceGouvernance: z.string().nullish(),
  participationCitoyenne: z.string().nullish(),
  participationCitoyenneType: participationCitoyenneEnumSchema.nullish(),
  tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvreSchema.nullish(),

  actionImpactId: z.number().nullish(),

  // Champ calculé
  planId: z.number().nullish(),

  // Tables liées
  thematiques: thematiqueSchema.array().nullish(),
  sousThematiques: sousThematiqueSchema.array().nullish(),
  pilotes: personneSchema.array().nullish(),
  referents: personneSchema.array().nullish(),
  services: tagSchema.array().nullish(),
  structures: tagSchema.array().nullish(),
  partenaires: tagSchema.array().nullish(),
  plans: axeSchema.array().nullish(),
  axes: axeSchema.array().nullish(),
  actions: actionSchema.array().nullish(),
  financeurs: financeurSchemaUpdate
    // .extend({ id: financeurSchema.shape.id.optional() })
    .array()
    .nullish(),
  indicateurs: indicateurListItemSchema.array().nullish(),
  libresTag: tagSchema.array().nullish(),
});

export type FicheAction = z.infer<typeof ficheActionSchema>;

export const noteSuiviSchema = z.object({
  id: z.number(),
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  modifiedAt: z.string().datetime(),
  modifiedBy: z.string(),
  dateNote: z.string().datetime(),
  note: z.string(),
});

export type FicheActionNote = z.infer<typeof noteSuiviSchema>;
