import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { sumTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { chunk } from 'es-toolkit';
import {
  ClassificationDraft,
  UnclassifiedFiche,
} from '../models/classification-draft';
import { ClassifiedFiche } from './classify-fiches/apply-classification';
import { classifyFiches } from './classify-fiches/classify-fiches';
import { FicheToClassify } from './classify-fiches/render-fiches-text';

export const FICHES_PER_BATCH = 25;
export const BATCHES_IN_PARALLEL = 5;

export const MAX_FAILED_BATCH_RATIO = 0.5;

type BatchOutcome =
  | {
      kind: 'classified';
      fiches: ClassifiedFiche[];
      tokens: TokenUsage;
    }
  | { kind: 'failed'; ficheIds: number[]; reason: string };

export type ClassificationRun =
  | { kind: 'completed'; draft: ClassificationDraft; tokens: TokenUsage }
  | {
      kind: 'too_many_failed_batches';
      failedBatches: number;
      totalBatches: number;
    };

const classifyBatch = async (
  llm: Pick<LlmService, 'generateStructured'>,
  fiches: FicheToClassify[],
  signal?: AbortSignal
): Promise<BatchOutcome> => {
  const classifyResult = await classifyFiches(llm, { fiches, signal });

  if (classifyResult.success) {
    return {
      kind: 'classified',
      fiches: classifyResult.data.fiches,
      tokens: classifyResult.data.tokens,
    };
  }

  return {
    kind: 'failed',
    ficheIds: fiches.map(({ ficheId }) => ficheId),
    reason: classifyResult.error.kind,
  };
};

const toUnclassified = (outcome: BatchOutcome): UnclassifiedFiche[] => {
  if (outcome.kind !== 'failed') {
    return [];
  }
  return outcome.ficheIds.map((ficheId) => ({
    ficheId,
    reason: outcome.reason,
  }));
};

export type RunClassificationInput = {
  fiches: FicheToClassify[];
  signal?: AbortSignal;
  onBatchProcessed?: (processedBatches: number) => void;
};

export const runClassification = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { fiches, signal, onBatchProcessed }: RunClassificationInput
): Promise<ClassificationRun> => {
  const batches = chunk(fiches, FICHES_PER_BATCH);

  const outcomes = await mapWithConcurrency(
    batches,
    BATCHES_IN_PARALLEL,
    (batch) => classifyBatch(llm, batch, signal),
    onBatchProcessed
  );

  const failedBatches = outcomes.filter(({ kind }) => kind === 'failed').length;
  const isTooDegraded = failedBatches > batches.length * MAX_FAILED_BATCH_RATIO;
  if (isTooDegraded) {
    return {
      kind: 'too_many_failed_batches',
      failedBatches,
      totalBatches: batches.length,
    };
  }

  return {
    kind: 'completed',
    draft: {
      fiches: outcomes.flatMap((outcome) =>
        outcome.kind === 'classified' ? outcome.fiches : []
      ),
      unclassified: outcomes.flatMap(toUnclassified),
    },
    tokens: sumTokenUsage(
      outcomes.flatMap((outcome) =>
        outcome.kind === 'classified' ? [outcome.tokens] : []
      )
    ),
  };
};
