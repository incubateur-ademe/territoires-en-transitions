import { z } from 'zod';

export const modelDoubtMotifValues = [
  'aucune-action',
  'texte-illisible',
  'plusieurs-plans',
  'grilles-concurrentes',
] as const;

export type ModelDoubtMotif = (typeof modelDoubtMotifValues)[number];

/**
 * Ce que le modèle dit ne pas pouvoir lire, avec les passages qui le
 * montrent. Ni longueur ni nombre de citations dans le schéma : un écart y
 * effacerait le doute, le code coupe ce qui dépasse.
 */
export const modelDoubtSchema = z.object({
  motif: z.enum(modelDoubtMotifValues),
  citations: z.array(z.string()),
  explication: z.string(),
});

export type ModelDoubt = z.output<typeof modelDoubtSchema>;

/** Pages lues sans texte exploitable : de quoi confirmer un texte illisible. */
export const readingStatsSchema = z.object({
  pageCount: z.number().int().nonnegative(),
  unreadablePages: z.number().int().nonnegative(),
});

export type ReadingStats = z.output<typeof readingStatsSchema>;

/** Une citation retrouvée dans le document, à sa page (à partir de 1). */
export type DoubtEvidence = { citation: string; page: number };

/**
 * Le modèle préfère s'arrêter, ses citations sont dans le document et le code
 * le confirme : l'import s'arrête plutôt que d'inventer un plan.
 */
export type AnalysisAbandonedError = {
  kind: 'analysis_abandoned';
  motif: ModelDoubtMotif;
  evidence: DoubtEvidence[];
  /** Les mots du modèle, coupés : jamais envoyés au suivi ni par email. */
  explanation: string;
  readingStats?: ReadingStats;
};
