import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { chunk } from 'es-toolkit';
import {
  ClassificationDraft,
  UnclassifiedFiche,
} from '../models/classification-leviers-job';
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

const emptyTokenUsage: TokenUsage = {
  promptTokens: 0,
  candidatesTokens: 0,
  thoughtsTokens: 0,
  totalTokens: 0,
};

const sumTokens = (usages: TokenUsage[]): TokenUsage =>
  usages.reduce(
    (total, usage) => ({
      promptTokens: total.promptTokens + usage.promptTokens,
      candidatesTokens: total.candidatesTokens + usage.candidatesTokens,
      thoughtsTokens: total.thoughtsTokens + usage.thoughtsTokens,
      totalTokens: total.totalTokens + usage.totalTokens,
    }),
    emptyTokenUsage
  );

const classifyBatch = async (
  llm: Pick<LlmService, 'generateStructured'>,
  fiches: FicheToClassify[]
): Promise<BatchOutcome> => {
  const classifyResult = await classifyFiches(llm, { fiches });

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
  onBatchProcessed?: (processedBatches: number) => void;
};

export const runClassification = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { fiches, onBatchProcessed }: RunClassificationInput
): Promise<ClassificationRun> => {
  const batches = chunk(fiches, FICHES_PER_BATCH);

  const outcomes = await mapWithConcurrency(
    batches,
    BATCHES_IN_PARALLEL,
    (batch) => classifyBatch(llm, batch),
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
    tokens: sumTokens(
      outcomes.flatMap((outcome) =>
        outcome.kind === 'classified' ? [outcome.tokens] : []
      )
    ),
  };
};
