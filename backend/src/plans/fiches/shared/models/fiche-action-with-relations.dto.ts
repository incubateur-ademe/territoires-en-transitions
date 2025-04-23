import {
  collectiviteSchema,
  personneTagOrUserSchema,
} from '@/backend/collectivites/index-domain';
import { tagWithOptionalCollectiviteSchema } from '@/backend/collectivites/tags/tag.table-base';
import { axeSchema } from '@/backend/plans/fiches/shared/models/axe.table';
import z from 'zod';
import { ficheSchema } from './fiche-action.table';
import { ficheActionBudgetSchema } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';

export const ficheActionWithRelationsSchema = ficheSchema.extend({
  createdByName: z.string(),
  modifiedByName: z.string().nullish(),
  tempsDeMiseEnOeuvreNom: z.string().nullish(),
  partenaires: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Partenaires'),
  pilotes: z
    .array(personneTagOrUserSchema)
    .nullable()
    .describe('Personnes pilote'),
  referents: z
    .array(personneTagOrUserSchema)
    .nullable()
    .describe('Élu·e référent·e'),
  tags: z
    .array(tagWithOptionalCollectiviteSchema)
    .nullable()
    .describe('Tags personnalisés'),
  financeurs: z
    .object({
      id: z.number(),
      nom: z.string(),
      montantTtc: z.number().optional(),
    })
    .array()
    .nullable()
    .describe('Financeurs'),
  sousThematiques: z
    .array(tagWithOptionalCollectiviteSchema)
    .nullable()
    .describe('Sous-thématiques'),
  thematiques: z
    .array(tagWithOptionalCollectiviteSchema)
    .nullable()
    .describe('Thématiques'),
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
    .array(tagWithOptionalCollectiviteSchema)
    .nullable()
    .describe('Effets attendus'),
  axes: z
    .object({
      id: z.number(),
      nom: z.string(),
      parentId: z.number().nullable(),
      parentNom: z.string().nullable(),
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
    .describe('Fiches des plans liées'),
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
      ficheId : z.number(),
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
});

export type FicheActionWithRelationsType = z.infer<
  typeof ficheActionWithRelationsSchema
>;

export const ficheActionWithRelationsAndCollectiviteSchema =
  ficheActionWithRelationsSchema.extend({
    collectivite: collectiviteSchema
      .optional()
      .describe('Collectivité à laquelle la fiche est rattachée'),
  });
export type FicheActionWithRelationsAndCollectiviteType = z.infer<
  typeof ficheActionWithRelationsAndCollectiviteSchema
>;

export const ficheActionResumeSchema = ficheActionWithRelationsSchema
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

export type FicheActionResumeType = z.infer<typeof ficheActionResumeSchema>;
