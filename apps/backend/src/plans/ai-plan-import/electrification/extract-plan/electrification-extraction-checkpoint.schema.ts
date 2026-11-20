import { tokenUsageSchema } from '@tet/backend/utils/llm/token-usage';
import { z } from 'zod';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import {
  electrificationDocumentSourceSchema,
  electrificationExtractionResponseSchema,
} from './electrification-extraction.schema';
import { electrificationValueInterpretationSchema } from './electrification-value-interpretation.schema';
import { ElectrificationValueInterpretationRules } from './electrification-value-interpretation.rules';
import { electrificationEngagementInterpretationSchema } from './electrification-engagement-interpretation.schema';
import { electrificationExtractionErrors } from './electrification-extraction.errors';

/** Brouillon documentaire seulement. La reprise résout à nouveau les objets TeT. */
export const electrificationExtractionCheckpointSchema = z
  .strictObject({
    profile: z.literal(AiPlanImportProfileEnum.ELECTRIFICATION),
    // Version du contrat persisté, indépendante des formats Word acceptés.
    // Après la première mise en production, incrémenter si la structure ou le
    // sens des données rend la reprise des checkpoints existants incompatible.
    schemaVersion: z.literal(1),
    catalogueVersion: z.string().min(1),
    documentKind: z.literal('docx'),
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
