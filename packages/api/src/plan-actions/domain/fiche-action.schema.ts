import { personneSchema } from '@/api/collectivites';
import { indicateurListItemSchema } from '@/api/indicateurs/domain';
import { actionSchema } from '@/api/referentiel';
import { authorSchema } from '@/backend/auth';
import { tagSchema } from '@/backend/collectivites';
import {
  axeSchema,
  ciblesEnumSchema,
  financeurSchemaUpdate,
  participationCitoyenneEnumSchema,
  prioriteEnumSchema,
  statutsEnumSchema,
} from '@/backend/plans/fiches';
import {
  effetAttenduSchema,
  sousThematiqueSchema,
  tempsDeMiseEnOeuvreSchema,
  thematiqueSchema,
} from '@/backend/shared';
import { z } from 'zod';

export const ficheActionSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  modifiedAt: z.string().datetime().nullish(),
  createdAt: z.string().datetime().nullish(),
  createdBy: authorSchema.nullable(),
  modifiedBy: authorSchema.nullable(),
  titre: z.string().nullable(),
  description: z.string().nullish(),
  statut: statutsEnumSchema.nullish(),
  ameliorationContinue: z.boolean().nullish(),
  dateFinProvisoire: z
    .string()
    .date()
    .or(z.string().datetime({ offset: true }))
    .nullish(),
  priorite: prioriteEnumSchema.nullish(),
  cibles: ciblesEnumSchema.array().nullish(),
  restreint: z.boolean().nullish(),
  resultatsAttendus: effetAttenduSchema.array().nullish(),
  objectifs: z.string().nullish(),
  budgetPrevisionnel: z.number().nullish(),
  calendrier: z.string().nullish(),
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

export const ficheActionInsertSchema = ficheActionSchema.extend({
  id: z.number().optional(),
  modifiedAt: z.string().datetime().optional(),
  titre: z.string().nullable(),
  pilotes: personneSchema.array().optional(),
  plans: axeSchema.pick({ id: true, collectiviteId: true }).array().nullish(),
});

export type FicheActionInsert = z.infer<typeof ficheActionInsertSchema>;

export const ficheActionUpdateSchema = ficheActionSchema.extend({});

export const ficheResumeSchema = ficheActionSchema
  .pick({
    id: true,
    collectiviteId: true,
    modifiedAt: true,
    titre: true,
    statut: true,
    ameliorationContinue: true,
    dateDebut: true,
    dateFinProvisoire: true,
    priorite: true,
    restreint: true,
    pilotes: true,
    plans: true,
    planId: true,
    services: true,
    actionImpactId: true,
  })
  .extend({
    plans: axeSchema
      .pick({ id: true, collectiviteId: true, nom: true })
      .array()
      .nullish(),
  });

export type FicheResume = z.infer<typeof ficheResumeSchema>;
