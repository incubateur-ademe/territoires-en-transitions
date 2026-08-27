import * as z from 'zod/mini';
import { demarchePcaetTopicKindSchema } from './demarche-pcaet-topic-kind.enum.schema';
import { demarchePcaetVulnerabiliteSchema } from './demarche-pcaet-vulnerabilite.schema';

/**
 * Valeur de référence issue de l'open data, affichée à côté de la saisie de la
 * collectivité. Elle ne s'y substitue jamais : le dépôt ne retient que ce que
 * la collectivité a renseigné.
 */
export const demarchePcaetDiagnosticReferenceSchema = z.object({
  /** Le libellé et la couleur de la source sont résolus à l'affichage. */
  sourceId: z.string(),
  /** Version de la source, deux sources ne couvrant pas les mêmes millésimes. */
  millesime: z.nullable(z.string()),
  resultat: z.nullable(z.number()),
});

export type DemarchePcaetDiagnosticReference = z.infer<
  typeof demarchePcaetDiagnosticReferenceSchema
>;

/** Une cellule de la grille : la saisie de la collectivité et ses références. */
export const demarchePcaetDiagnosticValeurSchema = z.object({
  indicateurId: z.number(),
  year: z.number(),
  resultat: z.nullable(z.number()),
  objectif: z.nullable(z.number()),
  references: z.array(demarchePcaetDiagnosticReferenceSchema),
});

export type DemarchePcaetDiagnosticValeur = z.infer<
  typeof demarchePcaetDiagnosticValeurSchema
>;

const topicRowBaseSchema = z.object({
  label: z.string(),
  /** Identifiant de l'indicateur dont la ligne porte les valeurs. */
  referentielId: z.nullable(z.string()),
  /** `null` quand l'identifiant n'a pas de définition : ligne non saisissable. */
  indicateurId: z.nullable(z.number()),
  requis: z.boolean(),
});

export const demarchePcaetTopicLeafSchema = topicRowBaseSchema;

export type DemarchePcaetTopicLeaf = z.infer<
  typeof demarchePcaetTopicLeafSchema
>;

/**
 * Ligne de premier niveau. La profondeur s'arrête là, d'où deux schémas plutôt
 * qu'une récursion : le contrat est explicite.
 */
export const demarchePcaetTopicRowSchema = z.extend(topicRowBaseSchema, {
  rows: z.array(demarchePcaetTopicLeafSchema),
});

export type DemarchePcaetTopicRow = z.infer<typeof demarchePcaetTopicRowSchema>;

/**
 * Un onglet du diagnostic : le référentiel attendu et les valeurs constatées,
 * servis ensemble pour que le front et le serveur appliquent les mêmes règles
 * au même objet.
 */
export const demarchePcaetTopicSchema = z.object({
  code: z.string(),
  label: z.string(),
  /** Nom d'icône RemixIcon de l'onglet. */
  icon: z.string(),
  kind: demarchePcaetTopicKindSchema,
  /** Nom métier du premier niveau (Secteur, Polluant, Vecteur…). */
  groupLabel: z.nullable(z.string()),
  /** Nom métier du second niveau, `null` si le topic est à un niveau. */
  rowLabel: z.nullable(z.string()),
  unit: z.nullable(z.string()),
  /** Indicateur agrégé du topic. */
  referentielId: z.nullable(z.string()),
  horizons: z.array(z.number()),
  /** Année de comptabilisation dérivée des résultats saisis, `null` hors grille. */
  referenceYear: z.nullable(z.number()),
  /**
   * Années hors comptabilisation et horizons, présentes dans les valeurs
   * saisies. Les colonnes vides ajoutées côté UI ne sont pas persistées.
   */
  extraYears: z.array(z.number()),
  /** Colonnes de la grille : comptabilisation, horizons et années des valeurs. */
  years: z.array(z.number()),
  rows: z.array(demarchePcaetTopicRowSchema),
  valeurs: z.array(demarchePcaetDiagnosticValeurSchema),
  /**
   * Contenu du topic `vulnerabilite`, `null` pour les topics à indicateurs.
   */
  vulnerabilite: z.nullish(demarchePcaetVulnerabiliteSchema),
});

export type DemarchePcaetTopic = z.infer<typeof demarchePcaetTopicSchema>;

/** Diagnostic servi au front : toujours live (plus de photo figée). */
export const demarchePcaetDiagnosticPayloadSchema = z.object({
  topics: z.array(demarchePcaetTopicSchema),
});

export type DemarchePcaetDiagnosticPayload = z.infer<
  typeof demarchePcaetDiagnosticPayloadSchema
>;

export const demarchePcaetDiagnosticSchema = demarchePcaetDiagnosticPayloadSchema;

export type DemarchePcaetDiagnostic = DemarchePcaetDiagnosticPayload;
