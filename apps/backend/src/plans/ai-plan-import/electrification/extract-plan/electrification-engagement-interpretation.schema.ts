import { z } from 'zod';
import type { ElectrificationDocumentSource } from './electrification-extraction.schema';

/** Comparaison du modèle ; la classification persistée est déduite par le code. */
export const electrificationEngagementComparisonSchema = z.strictObject({
  code: z.string().min(1).nullable(),
  quote: z.string().min(1),
  action: z.enum(['same-outcome', 'different', 'uncertain']),
  objectives: z.enum(['compatible', 'different', 'uncertain']),
});

export const electrificationEngagementInterpretationSchema = z.strictObject({
  sourceId: z.string().min(1),
  // Les anciennes classifications restent lisibles à la reprise ; tous les
  // rapprochements sont désormais signalés à vérifier, quelle que soit celle-ci.
  match: z.enum([
    'review-required',
    'equivalent',
    'scope-difference',
    'unresolved',
  ]),
  code: z.string().min(1).nullable(),
  quote: z.string().min(1),
});
export type ElectrificationEngagementInterpretation = z.infer<
  typeof electrificationEngagementInterpretationSchema
>;
export type ElectrificationEngagementMatchRequest = {
  source: ElectrificationDocumentSource;
  candidates: { code: string; label: string }[];
};
