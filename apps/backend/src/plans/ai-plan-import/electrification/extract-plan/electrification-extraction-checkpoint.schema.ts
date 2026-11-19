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
import { electrificationExtractionErrors } from './electrification-extraction.errors';

/** À incrémenter si le format ou son interprétation rend une reprise incompatible. */
export const ELECTRIFICATION_CHECKPOINT_VERSION = 3;

export const electrificationCheckpointVersionSchema = z.literal(
  ELECTRIFICATION_CHECKPOINT_VERSION
);

/** Brouillon documentaire seulement. La reprise résout à nouveau les objets TeT. */
export const electrificationExtractionCheckpointSchema = z
  .strictObject({
    profile: z.literal(AiPlanImportProfileEnum.ELECTRIFICATION),
    schemaVersion: electrificationCheckpointVersionSchema,
    catalogueVersion: z.string().min(1),
    documentKind: z.literal('docx'),
    templateVersion: z.literal(electrificationDocumentTemplate.version),
    response: electrificationExtractionResponseSchema,
    sources: z.array(electrificationDocumentSourceSchema).min(1),
    interpretations: z.array(electrificationValueInterpretationSchema),
    engagementInterpretations: z.array(
      electrificationEngagementInterpretationSchema
    ),
    tokens: tokenUsageSchema,
  })
  .refine(
    ({ sources, interpretations, engagementInterpretations, response }) => {
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
        interpretations.every((interpretation) => {
          const source = sources.find(
            ({ id }) => id === interpretation.sourceId
          );
          return (
            source &&
            ElectrificationValueInterpretationRules.hasEvidence(
              source.text,
              interpretation
            )
          );
        })
      );
    },
    electrificationExtractionErrors.INVALID_INTERPRETATION_SOURCE.message
  );
export type ElectrificationExtractionCheckpoint = z.infer<
  typeof electrificationExtractionCheckpointSchema
>;
