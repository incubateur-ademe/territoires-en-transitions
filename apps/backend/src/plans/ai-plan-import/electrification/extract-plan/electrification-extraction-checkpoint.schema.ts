import { tokenUsageSchema } from '@tet/backend/utils/llm/token-usage';
import { z } from 'zod';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import {
  electrificationDocumentSourceSchema,
  electrificationExtractionResponseSchema,
} from './electrification-extraction.schema';
import { electrificationDocumentTemplate } from './electrification-document-template.constants';
import { electrificationValueInterpretationSchema } from './electrification-value-interpretation.schema';
import { ElectrificationValueInterpretationRules } from './electrification-value-interpretation.rules';

/** À incrémenter si le format ou son interprétation rend une reprise incompatible. */
export const ELECTRIFICATION_CHECKPOINT_VERSION = 1;

/** Brouillon documentaire seulement. La reprise résout à nouveau les objets TeT. */
export const electrificationExtractionCheckpointSchema = z
  .strictObject({
    profile: z.literal(AiPlanImportProfileEnum.ELECTRIFICATION),
    schemaVersion: z.literal(ELECTRIFICATION_CHECKPOINT_VERSION),
    catalogueVersion: z.string().min(1),
    documentKind: z.literal('docx'),
    templateVersion: z.literal(electrificationDocumentTemplate.version),
    response: electrificationExtractionResponseSchema,
    sources: z.array(electrificationDocumentSourceSchema).min(1),
    interpretations: z.array(electrificationValueInterpretationSchema),
    tokens: tokenUsageSchema,
  })
  .refine(({ sources, interpretations }) => {
    const ids = interpretations.map(({ sourceId }) => sourceId);
    return (
      new Set(ids).size === ids.length &&
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
  }, 'Les interprétations doivent citer les valeurs originales du document.');
export type ElectrificationExtractionCheckpoint = z.infer<
  typeof electrificationExtractionCheckpointSchema
>;
