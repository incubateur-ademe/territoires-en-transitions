import { z } from 'zod';
import {
  documentKindSchema,
  genericImportContractSchema,
  pipelineCheckpointSchema,
  type PipelineCheckpoint,
} from '../pipeline/pipeline-checkpoint';
import type { ImportJobStats } from './import-job-stats';

/**
 * Point de reprise gardé sur le job : la pipeline telle qu'après sa dernière
 * étape terminée, et ce que le service avait relevé du document lu.
 */
export type ImportCheckpoint = PipelineCheckpoint & {
  documentStats: ImportJobStats['document'];
};

const countSchema = z.number().int().nonnegative();

export const importCheckpointSchema = pipelineCheckpointSchema
  .extend({
    documentStats: z
      .object({
        kind: documentKindSchema,
        mimeType: z.string(),
        sizeBytes: countSchema,
        pageCount: countSchema,
        textPages: countSchema,
        ocrPages: countSchema,
        emptyPages: countSchema,
        ocrFailures: countSchema,
        chars: countSchema,
      })
      .nullable(),
  })
  .superRefine(({ progress, source }, context) => {
    if (source.chunkIndexByAction.length !== progress.actions.length) {
      context.addIssue({
        code: 'custom',
        path: ['source', 'chunkIndexByAction'],
        message: 'Chaque action doit être rattachée à une tranche source',
      });
    }
    if (
      source.chunkIndexByAction.some((index) => index >= source.chunks.length)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['source', 'chunkIndexByAction'],
        message: 'La tranche source doit exister',
      });
    }
  }) satisfies z.ZodType<ImportCheckpoint>;

export const parseImportCheckpoint = (value: unknown) =>
  importCheckpointSchema.safeParse(value);

export const isSupportedGenericImport = (options: unknown): boolean =>
  genericImportContractSchema.safeParse(options).success;

/** L'éligibilité à la reprise et le worker utilisent le même contrat. */
export const isImportCheckpointSupported = (
  checkpoint: unknown,
  options: unknown
): boolean =>
  isSupportedGenericImport(options) &&
  parseImportCheckpoint(checkpoint).success;
