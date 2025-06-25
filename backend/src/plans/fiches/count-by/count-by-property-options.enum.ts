import { ficheActionBudgetSchema } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import z from 'zod';
import { ficheWithRelationsSchema } from '../list-fiches/fiche-action-with-relations.dto';

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
    mesures: true,
    dateDebut: true,
    dateFin: true,
    createdAt: true,
    modifiedAt: true,
    notes: true
  })
  .extend({
    budgetsPrevisionnelInvestissementTotal: ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(
        `Budget d'investissement prévisionnel total (non détaillé par année)`
      ),
    budgetsPrevisionnelInvestissementParAnnee: ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget d'investissement prévisionnel par année`),
    budgetsDepenseInvestissementTotal: ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(
        `Budget d'investissement dépensé total (non détaillé par année)`
      ),
    budgetsDepenseInvestissementParAnnee: ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget d'investissement dépensé par année`),
    budgetsPrevisionnelFonctionnementTotal: ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(
        `Budget de fonctionnement prévisionnel total (non détaillé par année)`
      ),
    budgetsPrevisionnelFonctionnementParAnnee: ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget de fonctionnement prévisionnel par année`),
    budgetsDepenseFonctionnementTotal: ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(
        `Budget de fonctionnement dépensé total (non détaillé par année)`
      ),
    budgetsDepenseFonctionnementParAnnee: ficheActionBudgetSchema
      .array()
      .nullable()
      .describe(`Budget de fonctionnement dépensé par année`),
    actionsParMesuresDeReferentiels: z
      .array(z.string())
      .nullable()
      .describe(`Actions liées à des mesures des référentiels`),
  });

export const countByPropertyOptions =
  ficheActionForCountBySchema.keyof().options;

export const countByPropertyEnumSchema = z.enum(countByPropertyOptions);

export type CountByPropertyEnumType = z.infer<typeof countByPropertyEnumSchema>;
