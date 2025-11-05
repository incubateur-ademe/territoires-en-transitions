import { z } from 'zod';
import { cibleEnumSchema } from './fiches/cible.enum.schema';
import { prioriteEnumSchema } from './fiches/priorite.enum.schema';
import { statutEnumSchema } from './fiches/statut.enum.schema';

// Budget schemas - simplified versions for count-by
const budgetTypeSchema = z.enum(['investissement', 'fonctionnement']);
const budgetUniteSchema = z.enum(['HT', 'ETP']);

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

// Minimal fiche schema for count-by operations
// This includes only the fields needed for counting operations
export const ficheActionForCountBySchema = z.object({
  restreint: z.boolean().nullable().describe('Confidentialité'),
  ameliorationContinue: z
    .boolean()
    .nullable()
    .describe('Action se répète tous les ans'),
  cibles: z.array(cibleEnumSchema).nullable().describe('Cibles'),
  statut: z.nullable(statutEnumSchema).describe('Statut'),
  priorite: z.nullable(prioriteEnumSchema).describe('Priorité'),
  partenaires: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Partenaires'),
  structures: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Structure pilote'),
  pilotes: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Personnes pilote'),
  services: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Directions ou services pilote'),
  libreTags: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Tags personnalisés'),
  financeurs: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Financeurs'),
  thematiques: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Thématiques'),
  plans: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe("Plans d'action"),
  referents: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Élu·e référent·e'),
  participationCitoyenneType: z
    .enum([
      'pas-de-participation',
      'information',
      'consultation',
      'concertation',
      'co-construction',
    ])
    .nullable()
    .describe('Participation citoyenne'),
  effetsAttendus: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Effets attendus'),
  sousThematiques: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
      })
    )
    .nullable()
    .describe('Sous-thématiques'),
  indicateurs: z
    .array(
      z.object({
        id: z.number(),
        nom: z.string(),
        unite: z.string(),
      })
    )
    .nullable()
    .describe('Indicateurs associés'),
  dateDebut: z.string().nullable().describe('Date de début'),
  dateFin: z.string().nullable().describe('Date de fin prévisionnelle'),
  createdAt: z.string().nullable().describe('Date de création'),
  modifiedAt: z.string().nullable().describe('Date de modification'),
  notes: z
    .array(
      z.object({
        note: z.string(),
        dateNote: z.string(),
      })
    )
    .nullable()
    .describe('Notes de suivi et points de vigilance'),
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
