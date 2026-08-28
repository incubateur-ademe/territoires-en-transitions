import * as z from 'zod/mini';
import { indicateurDefinitionSchema } from '../../../indicateurs/definitions/indicateur-definition.schema';
import { indicateurValeurAvecMetadonnesDefinitionSchema } from '../../../indicateurs/valeurs/indicateur-valeur.schema';
import {
  demarchePcaetVulnerabiliteLigneSchema,
  demarchePcaetVulnerabiliteThematiqueSchema,
} from './demarche-pcaet-vulnerabilite.schema';

/** Une cellule de la grille : la saisie de la collectivité et ses références. */
export const pcaetDiagnosticIndicateurValeurSchema = z.object({
  indicateurId: z.number(),
  year: z.number(),
  resultat: z.nullable(z.number()),
  objectif: z.nullable(z.number()),
});

export type PcaetDiagnosticIndicateurValeur = z.infer<
  typeof pcaetDiagnosticIndicateurValeurSchema
>;

const pcaetDiagnosticIndicateurChildLeafSchema = z.object({
  label: z.string(),
  indicateurDefinitionId: z.string(),
  optionalYears: z.optional(z.union([z.array(z.number()), z.literal('all')])),
});

export type PcaetDiagnosticIndicateurChildLeaf = z.infer<
  typeof pcaetDiagnosticIndicateurChildLeafSchema
>;

const pcaetDiagnosticIndicateurChildSchema = z.object({
  ...pcaetDiagnosticIndicateurChildLeafSchema.shape,

  groupBy: z.optional(z.string()),
  children: z.optional(z.array(pcaetDiagnosticIndicateurChildLeafSchema)),
});

/**
 * Topic indicateur : référentiel attendu et valeurs constatées, servis ensemble
 * pour que le front et le serveur appliquent les mêmes règles au même objet.
 */
export const pcaetDiagnosticIndicateurParentConfigSchema = z.object({
  code: z.string(),
  label: z.string(),
  icon: z.string(),
  optional: z.optional(z.boolean()),

  indicateurDefinitionId: z.string(),
  referenceYearApplyLevel: z.enum(['parent', 'child']),

  children: z.array(pcaetDiagnosticIndicateurChildSchema),
});

export type PcaetDiagnosticIndicateurParentConfig = z.infer<
  typeof pcaetDiagnosticIndicateurParentConfigSchema
>;

/**
 * Topic vulnérabilité : méta d'onglet + saisie (thématiques / lignes).
 * Hors grille indicateurs.
 */
export const pcaetDiagnosticVulnerabiliteSchema = z.object({
  code: z.string(),
  label: z.string(),
  icon: z.string(),

  horizons: z.array(z.number()),
  thematiques: z.array(demarchePcaetVulnerabiliteThematiqueSchema),
  lignes: z.array(demarchePcaetVulnerabiliteLigneSchema),
});

export type PcaetDiagnosticVulnerabilite = z.infer<
  typeof pcaetDiagnosticVulnerabiliteSchema
>;

export const pcaetDiagnosticSchema = z.object({
  indicateurParentConfigs: z.readonly(
    z.array(pcaetDiagnosticIndicateurParentConfigSchema)
  ),
  /** Définitions du référentiel, même sans saisie — pour peupler la grille vide. */
  indicateurDefinitions: z.array(indicateurDefinitionSchema),
  indicateurValeurs: z.array(indicateurValeurAvecMetadonnesDefinitionSchema),
  vulnerabilite: pcaetDiagnosticVulnerabiliteSchema,
});

export type PcaetDiagnostic = z.infer<typeof pcaetDiagnosticSchema>;

export const demarchePcaetDiagnosticSchema = pcaetDiagnosticSchema;
