import { z } from 'zod';
import type { ElectrificationDocumentSource } from './electrification-extraction.schema';

export const electrificationEngagementMatchSchema = z.strictObject({
  match: z.enum(['equivalent', 'scope-difference', 'unresolved']),
  code: z.string().min(1).nullable(),
  quote: z.string().min(1),
});
export const electrificationEngagementInterpretationSchema =
  electrificationEngagementMatchSchema.extend({
    sourceId: z.string().min(1),
  });
export type ElectrificationEngagementInterpretation = z.infer<
  typeof electrificationEngagementInterpretationSchema
>;
export type ElectrificationEngagementMatchRequest = {
  source: ElectrificationDocumentSource;
  candidates: { code: string; label: string }[];
};
