import {
  collectiviteSchema,
  personneTagOrUserSchemaWithContacts,
} from '@/backend/collectivites/index-domain';
import { tagWithOptionalCollectiviteSchema } from '@/backend/collectivites/tags/tag.table-base';
import { axeSchema } from '@/backend/plans/fiches/shared/models/axe.table';
import {
  effetAttenduSchema,
  sousThematiqueSchema,
  tempsDeMiseEnOeuvreSchema,
  thematiqueSchema,
} from '@/backend/shared/index-domain';
import z from 'zod';
import { financeurSchema } from '../shared/models/fiche-action-financeur-tag.table';
import { ficheSchema } from '../shared/models/fiche-action.table';

export const userSchema = z.object({
  id: z.string().uuid(),
  prenom: z.string(),
  nom: z.string(),
});

export const ficheWithRelationsSchema = ficheSchema.extend({
  createdBy: userSchema.nullish(),
  modifiedBy: userSchema.nullish(),
  tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvreSchema.nullish(),
  partenaires: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Partenaires'),
  pilotes: z
    .array(personneTagOrUserSchemaWithContacts)
    .nullable()
    .describe('Personnes pilote'),
  referents: z
    .array(personneTagOrUserSchemaWithContacts)
    .nullable()
    .describe('Élu·e référent·e'),
  libreTags: z
    .array(tagWithOptionalCollectiviteSchema)
    .nullable()
    .describe('Tags personnalisés'),
  financeurs: financeurSchema.array().nullable().describe('Financeurs'),
  sousThematiques: sousThematiqueSchema
    .array()
    .nullable()
    .describe('Sous-thématiques'),
  thematiques: thematiqueSchema.array().nullable().describe('Thématiques'),
  structures: z
    .array(tagWithOptionalCollectiviteSchema)
    .nullable()
    .describe('Structure pilote'),
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
    .array(tagWithOptionalCollectiviteSchema)
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
      parentId: z.number().nullable(),
      planId: z.number().nullable(),
    })
    .array()
    .nullable()
    .describe('Axes'),
  plans: z
    .array(tagWithOptionalCollectiviteSchema)
    .nullable()
    .describe("Plans d'action"),
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
    .describe('Notes de suivi et points de vigilance'),
  mesures: z
    .object({
      id: z.string(),
      identifiant: z.string(),
      nom: z.string(),
      referentiel: z.string(),
    })
    .array()
    .nullable()
    .describe('Mesures des référentiels liées'),
  fichesLiees: z
    .array(tagWithOptionalCollectiviteSchema)
    .nullable()
    .describe('Fiches action'),
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
      budgetPrevisionnel: z.string().nullable().optional(),
      budgetReel: z.string().nullable().optional(),
      estEtale: z.boolean().optional(),
    })
    .array()
    .nullable()
    .describe(`Budgets de la fiche action`),
  actionImpactId: z.number().nullish(),
});

export type FicheWithRelations = z.infer<typeof ficheWithRelationsSchema>;

export const ficheWithRelationsAndCollectiviteSchema =
  ficheWithRelationsSchema.extend({
    collectivite: collectiviteSchema
      .optional()
      .describe('Collectivité à laquelle la fiche est rattachée'),
  });
export type FicheWithRelationsAndCollectivite = z.infer<
  typeof ficheWithRelationsAndCollectiviteSchema
>;

export const ficheResumeSchema = ficheWithRelationsSchema
  .pick({
    id: true,
    collectiviteId: true,
    modifiedAt: true,
    titre: true,
    statut: true,
    ameliorationContinue: true,
    dateDebut: true,
    dateFin: true,
    priorite: true,
    restreint: true,
    pilotes: true,
    plans: true,
    services: true,
  })
  .extend({
    plans: axeSchema
      .pick({ id: true, collectiviteId: true, nom: true })
      .array()
      .nullish(),
    planId: z.number().nullish(),
    actionImpactId: z.number().nullish(),
  });

export type FicheResume = z.infer<typeof ficheResumeSchema>;
