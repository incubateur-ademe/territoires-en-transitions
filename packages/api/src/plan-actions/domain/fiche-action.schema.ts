import { indicateurListItemSchema } from '@tet/api/indicateurs/domain';
import { actionSchema } from '@tet/api/referentiel/domain/action.schema';
import {
  personneSchema,
  sousThematiqueSchemaId,
  tagSchema,
  thematiqueSchema,
} from '@tet/api/shared/domain';
import { z } from 'zod';
import { axeSchema } from './axe.schema';

// Enums

export const statutSchema = z.enum([
  'À venir',
  'En cours',
  'Réalisé',
  'En pause',
  'Abandonné',
  'Bloqué',
  'En retard',
  'A discuter',
]);

export type Statut = z.infer<typeof statutSchema>;

export const niveauPrioriteSchema = z.enum(['Élevé', 'Moyen', 'Bas']);

export type NiveauPriorite = z.infer<typeof niveauPrioriteSchema>;

export const cibleSchema = z.enum([
  'Grand public et associations',
  'Public Scolaire',
  'Autres collectivités du territoire',
  'Acteurs économiques',
  'Acteurs économiques du secteur primaire',
  'Acteurs économiques du secteur secondaire',
  'Acteurs économiques du secteur tertiaire',
  'Partenaires',
  'Collectivité elle-même',
  'Elus locaux',
  'Agents',
]);

export type Cible = z.infer<typeof cibleSchema>;

export const resultatsAttendus = z.enum([
  'Adaptation au changement climatique',
  'Allongement de la durée d’usage',
  'Amélioration de la qualité de vie',
  'Développement des énergies renouvelables',
  'Efficacité énergétique',
  'Préservation de la biodiversité',
  'Réduction des consommations énergétiques',
  'Réduction des déchets',
  'Réduction des émissions de gaz à effet de serre',
  'Réduction des polluants atmosphériques',
  'Sobriété énergétique',
]);

export type ResultatsAttendus = z.infer<typeof resultatsAttendus>;

export const financeurSchema = z.object({
  financeurTag: tagSchema,
  montantTtc: z.number().nullish(),
});

export type Financeur = z.infer<typeof financeurSchema>;

export const ficheActionSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  modifiedAt: z.string().datetime().nullish(),
  createdAt: z.string().datetime().nullish(),
  titre: z.string().nullable(),
  description: z.string().nullish(),
  statut: statutSchema.nullish(),
  ameliorationContinue: z.boolean().nullish(),
  dateFinProvisoire: z
    .string()
    .date()
    .or(z.string().datetime({ offset: true }))
    .nullish(),
  niveauPriorite: niveauPrioriteSchema.nullish(),
  cibles: cibleSchema.array().nullish(),
  restreint: z.boolean().nullish(),
  resultatsAttendus: resultatsAttendus.array().nullish(),
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

  // Champ calculé
  planId: z.number().nullish(),

  // Tables liées
  thematiques: thematiqueSchema.array().nullish(),
  sousThematiques: sousThematiqueSchemaId.array().nullish(),
  pilotes: personneSchema.array().nullish(),
  referents: personneSchema.array().nullish(),
  services: tagSchema.array().nullish(),
  structures: tagSchema.array().nullish(),
  partenaires: tagSchema.array().nullish(),
  plans: axeSchema.array().nullish(),
  axes: axeSchema.array().nullish(),
  actions: actionSchema.array().nullish(),
  financeurs: financeurSchema.array().nullish(),
  indicateurs: indicateurListItemSchema.array().nullish(),
});

export type FicheAction = z.infer<typeof ficheActionSchema>;

export const ficheActionInsertSchema = ficheActionSchema.extend({
  id: z.number().optional(),
  modifiedAt: z.string().datetime().optional(),
  titre: z.string().nullable(),
  pilotes: personneSchema.array().optional(),
  plans: axeSchema.pick({ id: true, collectiviteId: true }).array().nullish(),
});

export type FicheActionInsert = z.infer<typeof ficheActionInsertSchema>;

export const ficheActionUpdateSchema = ficheActionSchema.extend({});

export const resumeSchema = ficheActionSchema
  .pick({
    id: true,
    collectiviteId: true,
    modifiedAt: true,
    titre: true,
    statut: true,
    ameliorationContinue: true,
    dateFinProvisoire: true,
    niveauPriorite: true,
    restreint: true,
    pilotes: true,
    plans: true,
    planId: true,
    services: true,
  })
  .extend({
    plans: axeSchema
      .pick({ id: true, collectiviteId: true, nom: true })
      .array()
      .nullish(),
  });

export type FicheResume = z.infer<typeof resumeSchema>;
