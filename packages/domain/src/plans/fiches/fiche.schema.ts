import { z } from 'zod';
import {
  collectiviteSchema,
  financeurTagSchema,
  personneTagOrUserSchemaWithContacts,
  tagSchema,
  tagWithCollectiviteIdSchema,
} from '../../collectivites';
import {
  effetAttenduSchema,
  idNameSchema,
  sousThematiqueSchema,
  tempsDeMiseEnOeuvreSchema,
  thematiqueSchema,
} from '../../shared';
import { cibleEnumValues } from './cible.enum.schema';
import { participationCitoyenneEnumValues } from './participation-citoyenne.enum.schema';
import { piliersEciEnumSchema } from './pilier-eci.enum.schema';
import { prioriteEnumValues } from './priorite.enum.schema';
import { statutEnumValues } from './statut.enum.schema';

export const ficheSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  parentId: z.number().nullable(),
  titre: z.string().nullable().describe('Titre'),
  description: z.string().nullable().describe('Description'),
  piliersEci: z.array(piliersEciEnumSchema).nullable().describe('Piliers ECI'),
  objectifs: z.string().nullable().describe('Objectifs'),
  cibles: z.array(z.enum(cibleEnumValues)).nullable().describe('Cibles'),
  ressources: z.string().nullable().describe('Ressources'),
  financements: z.string().nullable().describe('Financements'),
  // numeric mapped as string in most drivers
  budgetPrevisionnel: z
    .string()
    .nullable()
    .describe('Budget prévisionnel total'),
  statut: z.enum(statutEnumValues).nullable().describe('Statut'),
  priorite: z.enum(prioriteEnumValues).nullable().describe('Priorité'),
  dateDebut: z.string().nullable().describe('Date de début'),
  dateFin: z.string().nullable().describe('Date de fin prévisionnelle'),
  ameliorationContinue: z
    .boolean()
    .nullable()
    .describe('Action se répète tous les ans'),
  calendrier: z.string().nullable().describe('Calendrier'),
  instanceGouvernance: z
    .string()
    .nullable()
    .describe('Instance de gouvernance'),
  participationCitoyenne: z
    .string()
    .nullable()
    .describe('Participation citoyenne'),
  participationCitoyenneType: z
    .enum(participationCitoyenneEnumValues)
    .nullable()
    .describe('Participation citoyenne'),
  tempsDeMiseEnOeuvre: z.number().nullable(),
  majTermine: z.boolean().nullable(),
  createdAt: z.iso.datetime().describe('Date de création'),
  createdBy: z.string().nullable(),
  modifiedAt: z.string().describe('Date de modification'),
  modifiedBy: z.string().nullable(),
  restreint: z.boolean().nullable().describe('Confidentialité'),
});

export type Fiche = z.infer<typeof ficheSchema>;

export const ficheSchemaCreate = z.object({
  ...ficheSchema.partial().shape,
  collectiviteId: z.number(),
});

export type FicheCreate = z.infer<typeof ficheSchemaCreate>;

export const ficheSchemaUpdate = ficheSchemaCreate
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    modifiedAt: true,
    modifiedBy: true,
    tempsDeMiseEnOeuvre: true,
  })
  .partial();

const financeurSchema = z.object({
  ficheId: z.number(),
  montantTtc: z.nullable(z.number()),
  financeurTagId: z.number(),
  financeurTag: financeurTagSchema,
});

export type Financeur = z.infer<typeof financeurSchema>;

export const userSchema = z.object({
  id: z.uuid(),
  prenom: z.string(),
  nom: z.string(),
});

const completionFields = ['titre', 'description', 'statut', 'pilotes'] as const;
export const completionSchema = z.object({
  ficheId: z.number(),
  fields: z.array(
    z.object({
      field: z.enum(completionFields),
      isCompleted: z.boolean(),
    })
  ),
  isCompleted: z.boolean(),
});

export const ficheWithRelationsSchema = ficheSchema.extend({
  collectiviteNom: z.string().nullable(),
  createdBy: userSchema.nullish(),
  modifiedBy: userSchema.nullish(),
  tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvreSchema.nullish(),
  partenaires: idNameSchema.array().nullable().describe('Partenaires'),
  pilotes: z
    .array(personneTagOrUserSchemaWithContacts)
    .nullable()
    .describe('Personnes pilote'),
  referents: z
    .array(personneTagOrUserSchemaWithContacts)
    .nullable()
    .describe('Élu·e référent·e'),
  libreTags: z.array(tagSchema).nullable().describe('Tags personnalisés'),
  financeurs: financeurSchema.array().nullable().describe('Financeurs'),
  sousThematiques: sousThematiqueSchema
    .array()
    .nullable()
    .describe('Sous-thématiques'),
  thematiques: z.array(thematiqueSchema).nullable().describe('Thématiques'),
  structures: z.array(tagSchema).nullable().describe('Structure pilote'),
  sharedWithCollectivites: idNameSchema
    .array()
    .nullable()
    .describe("Collectivités avec lesquelles l'action est partagée"),
  indicateurs: z
    .object({
      id: z.number(),
      nom: z.string(),
      unite: z.string(),
    })
    .array()
    .nullable()
    .describe('Indicateurs associés'),
  services: z
    .array(tagWithCollectiviteIdSchema)
    .nullable()
    .describe('Directions ou services pilote'),
  effetsAttendus: z
    .array(effetAttenduSchema)
    .nullable()
    .describe('Effets attendus'),
  axes: z
    .object({
      id: z.number(),
      nom: z.string(),
      collectiviteId: z.number(),
      parentId: z.number().nullable(),
      planId: z.number().nullable(),
      axeLevel: z.number(),
    })
    .array()
    .nullable()
    .describe('Axes'),
  plans: z.array(tagWithCollectiviteIdSchema).nullable().describe('Plans'),
  etapes: z
    .object({
      nom: z.string(),
      realise: z.boolean(),
      ordre: z.number(),
    })
    .array()
    .nullable()
    .describe('Etapes'),
  notes: z
    .object({
      note: z.string(),
      dateNote: z.string(),
    })
    .array()
    .nullable()
    .describe('Notes'),
  mesures: z
    .object({
      id: z.string(),
      identifiant: z.string(),
      nom: z.string(),
      referentiel: z.string(),
    })
    .array()
    .nullable()
    .describe('Mesures des référentiels'),
  fichesLiees: z.array(tagSchema).nullable().describe('Actions'),
  docs: z
    .object({
      id: z.number(),
      filename: z.string().optional(),
      url: z.string().optional(),
    })
    .array()
    .nullable()
    .describe('Documents liés'),
  budgets: z
    .object({
      id: z.number(),
      ficheId: z.number(),
      type: z.string(),
      unite: z.string(),
      annee: z.number().nullable().optional(),
      budgetPrevisionnel: z.number().nullable().optional(),
      budgetReel: z.number().nullable().optional(),
      estEtale: z.boolean().optional(),
    })
    .array()
    .nullable()
    .describe(`Budgets de l'action`),
  actionImpactId: z.number().nullish(),
  completion: completionSchema.describe('Données de completion de la fiche'),
});

export type FicheWithRelations = z.infer<typeof ficheWithRelationsSchema>;
export type Completion = z.infer<typeof completionSchema>;
export type CompletionField = (typeof completionFields)[number];

export const ficheWithRelationsAndCollectiviteSchema =
  ficheWithRelationsSchema.extend({
    collectivite: collectiviteSchema
      .optional()
      .describe("Collectivité à laquelle l'action est rattachée"),
  });
export type FicheWithRelationsAndCollectivite = z.infer<
  typeof ficheWithRelationsAndCollectiviteSchema
>;
