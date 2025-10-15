import {
  budgetTypeSchema,
  budgetUniteSchema,
} from '@/backend/plans/fiches/fiche-action-budget/budget.types';
import z from 'zod';
import { ficheWithRelationsSchema } from '../list-fiches/fiche-action-with-relations.dto';

const budgetSchema = z.object({
  id: z.number().optional(),
  type: budgetTypeSchema,
  unite: budgetUniteSchema,
  budgetPrevisionnel: z
    .union([z.string(), z.number()])
    .transform((val) => val.toString())
    .refine((val) => !isNaN(Number(val)), {
      message: "Expected 'budgetPrevisionnel' to be a numeric string",
    }),
  budgetReel: z
    .union([z.string(), z.number()])
    .transform((val) => val.toString())
    .refine((val) => !isNaN(Number(val)), {
      message: "Expected 'budgetReel' to be a numeric string",
    }),
});

const budgetSchemaArray = z.array(budgetSchema).nullable();

export const ficheActionForCountBySchema = ficheWithRelationsSchema
  .pick({
    restreint: true,
    ameliorationContinue: true,
    cibles: true,
    statut: true,
    priorite: true,
    partenaires: true,
    structures: true,
    pilotes: true,
    services: true,
    libreTags: true,
    financeurs: true,
    thematiques: true,
    plans: true,
    referents: true,
    participationCitoyenneType: true,
    effetsAttendus: true,
    sousThematiques: true,
    indicateurs: true,
    dateDebut: true,
    dateFin: true,
    createdAt: true,
    modifiedAt: true,
    notes: true,
  })
  .extend({
    budgetsPrevisionnelInvestissementTotal: budgetSchemaArray.describe(
      `Budget d'investissement prévisionnel total (non détaillé par année)`
    ),
    budgetsPrevisionnelInvestissementParAnnee: budgetSchemaArray.describe(
      `Budget d'investissement prévisionnel par année`
    ),
    budgetsDepenseInvestissementTotal: budgetSchemaArray.describe(
      `Budget d'investissement dépensé total (non détaillé par année)`
    ),
    budgetsDepenseInvestissementParAnnee: budgetSchemaArray.describe(
      `Budget d'investissement dépensé par année`
    ),
    budgetsPrevisionnelFonctionnementTotal: budgetSchemaArray.describe(
      `Budget de fonctionnement prévisionnel total (non détaillé par année)`
    ),
    budgetsPrevisionnelFonctionnementParAnnee: budgetSchemaArray.describe(
      `Budget de fonctionnement prévisionnel par année`
    ),
    budgetsDepenseFonctionnementTotal: budgetSchemaArray.describe(
      `Budget de fonctionnement dépensé total (non détaillé par année)`
    ),
    budgetsDepenseFonctionnementParAnnee: budgetSchemaArray.describe(
      `Budget de fonctionnement dépensé par année`
    ),
    actionsParMesuresDeReferentiels: z
      .array(z.string())
      .nullable()
      .describe(`Actions liées à des mesures des référentiels`),
  });

export const countByPropertyOptions =
  ficheActionForCountBySchema.keyof().options;

export const countByPropertyEnumSchema = z.enum(countByPropertyOptions);

export type CountByPropertyEnumType = z.infer<typeof countByPropertyEnumSchema>;
