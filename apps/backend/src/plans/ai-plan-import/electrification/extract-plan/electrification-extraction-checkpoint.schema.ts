import { tokenUsageSchema } from '@tet/backend/utils/llm/token-usage';
import { z } from 'zod';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import {
  electrificationDocumentSourceSchema,
  electrificationExtractionResponseSchema,
} from './electrification-extraction.schema';
import { electrificationDocumentTemplate } from '@tet/backend/plans/plans/electrification/config/electrification-document-template.constants';
import { electrificationValueInterpretationSchema } from './electrification-value-interpretation.schema';
import { ElectrificationValueInterpretationRules } from './electrification-value-interpretation.rules';
import { electrificationEngagementInterpretationSchema } from './electrification-engagement-interpretation.schema';

/** À incrémenter si le format ou son interprétation rend une reprise incompatible. */
export const ELECTRIFICATION_CHECKPOINT_VERSION = 2;

export const electrificationCheckpointVersionSchema = z.union([
  z.literal(1),
  z.literal(ELECTRIFICATION_CHECKPOINT_VERSION),
]);
export type ElectrificationCheckpointVersion = z.infer<
  typeof electrificationCheckpointVersionSchema
>;

const checkpointFields = {
  profile: z.literal(AiPlanImportProfileEnum.ELECTRIFICATION),
  catalogueVersion: z.string().min(1),
  documentKind: z.literal('docx'),
  templateVersion: z.literal(electrificationDocumentTemplate.version),
  response: electrificationExtractionResponseSchema,
  sources: z.array(electrificationDocumentSourceSchema).min(1),
  interpretations: z.array(electrificationValueInterpretationSchema),
  tokens: tokenUsageSchema,
};

/** Brouillon documentaire seulement. La reprise résout à nouveau les objets TeT. */
export const electrificationExtractionCheckpointSchema = z
  .discriminatedUnion('schemaVersion', [
    z.strictObject({
      ...checkpointFields,
      schemaVersion: z.literal(1),
      engagementInterpretations: z.never().optional(),
    }),
    z.strictObject({
      ...checkpointFields,
      schemaVersion: z.literal(ELECTRIFICATION_CHECKPOINT_VERSION),
      engagementInterpretations: z.array(
        electrificationEngagementInterpretationSchema
      ),
    }),
  ])
  .refine(
    ({
      sources,
      interpretations,
      engagementInterpretations = [],
      response,
    }) => {
      const ids = interpretations.map(({ sourceId }) => sourceId);
      return (
        new Set(ids).size === ids.length &&
        new Set(engagementInterpretations.map(({ sourceId }) => sourceId))
          .size === engagementInterpretations.length &&
        engagementInterpretations.every(
          ({ sourceId, quote, code }) =>
            code !== null &&
            sources.some(({ id, text }) => id === sourceId && text === quote) &&
            response.engagements.some(
              (engagement) =>
                engagement.source === sourceId && engagement.code === code
            )
        ) &&
        interpretations.every(({ sourceId, values }) => {
          const source = sources.find(({ id }) => id === sourceId);
          return (
            source &&
            ElectrificationValueInterpretationRules.hasEvidence(
              source.text,
              values
            )
          );
        })
      );
    },
    'Les interprétations doivent citer les valeurs originales du document.'
  );
export type ElectrificationExtractionCheckpoint = z.infer<
  typeof electrificationExtractionCheckpointSchema
>;
