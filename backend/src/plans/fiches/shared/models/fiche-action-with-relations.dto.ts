import { collectiviteSchema } from '@/backend/collectivites/index-domain';
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
    .object({
      tagId: z.number().nullable(),
      userId: z.string().nullable(),
      nom: z.string().nullable(),
      prenom: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      telephone: z.string().optional().nullable(),
    })
    .array()
    .nullable()
    .describe('Personnes pilote'),
  referents: z
    .object({
      tagId: z.number().nullable(),
      userId: z.string().nullable(),
      nom: z.string().nullable(),
      prenom: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      telephone: z.string().optional().nullable(),
    })
    .array()
    .nullable()
    .describe('Élu·e référent·e'),
  tags: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
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
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Sous-thématiques'),
  thematiques: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Thématiques'),
  structures: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
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
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Directions ou services pilote'),
  effetsAttendus: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
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
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
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
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
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
  budgetsPrevisionnelInvestissementTotal:
    ficheActionBudgetSchema
    .array()
      .nullable()
    .describe(`Budget d'investissement prévisionnel total (non détaillé par année)`),
  budgetsPrevisionnelInvestissementParAnnee:
    ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget d'investissement prévisionnel par année`),
  budgetsDepenseInvestissementTotal:
    ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget d'investissement dépensé total (non détaillé par année)`),
  budgetsDepenseInvestissementParAnnee:
    ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget d'investissement dépensé par année`),
  budgetsPrevisionnelFonctionnementTotal:
    ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget de fonctionnement prévisionnel total (non détaillé par année)`),
  budgetsPrevisionnelFonctionnementParAnnee:
    ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget de fonctionnement prévisionnel par année`),
  budgetsDepenseFonctionnementTotal:
    ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget de fonctionnement dépensé total (non détaillé par année)`),
  budgetsDepenseFonctionnementParAnnee:
    ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget de fonctionnement dépensé par année`),
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
