import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import {
  GenerateStructuredArgs,
  LlmService,
} from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { ZodType } from 'zod';
import { FicheClassification } from './classify-fiches/classify-fiches.schema';
import { FicheToClassify } from './classify-fiches/render-fiches-text';
import { FICHES_PER_BATCH, runClassification } from './run-classification';

const tokens = {
  promptTokens: 10,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

type LlmAnswer = Awaited<ReturnType<LlmService['generateStructured']>>;
type StubbedLlm = Pick<LlmService, 'generateStructured'>;

const toFiche = (ficheId: number): FicheToClassify => ({
  ficheId,
  titre: `Fiche ${ficheId}`,
  description: 'Aménagement de pistes cyclables',
});

const toFiches = (count: number): FicheToClassify[] =>
  Array.from({ length: count }, (unused, index) => toFiche(index + 1));

const toFicheClassification = (index: number): FicheClassification => ({
  index,
  justification: 'Le texte décrit un aménagement cyclable.',
  hasNoRelevantLevier: false,
  volets: [
    { levier: 'Vélo et transport en commun', categories: ['amenagement'] },
  ],
});

const toClassifiedAnswer = (prompt: string): LlmAnswer => {
  const actionCount = (prompt.match(/<action index=/g) ?? []).length;
  return success({
    data: Array.from({ length: actionCount }, (unused, index) =>
      toFicheClassification(index)
    ),
    tokens,
  });
};

const llmFailingOnBatch = (failingBatchIndexes: number[]): StubbedLlm => {
  let batchIndex = -1;
  const truncated: LlmError = { kind: 'truncated' };
  const generateStructured = async (
    args: GenerateStructuredArgs<ZodType>
  ): Promise<LlmAnswer> => {
    batchIndex += 1;
    if (failingBatchIndexes.includes(batchIndex)) {
      return failure(truncated);
    }
    return toClassifiedAnswer(args.prompt);
  };
  return { generateStructured } as unknown as StubbedLlm;
};

const llmClassifying = (): StubbedLlm => llmFailingOnBatch([]);

describe('runClassification', () => {
  it("classe toutes les fiches d'un lot unique", async () => {
    const run = await runClassification(llmClassifying(), {
      fiches: toFiches(3),
    });
    expect(
      run.kind === 'completed' && run.draft.fiches.map(({ ficheId }) => ficheId)
    ).toEqual([1, 2, 3]);
  });

  it('découpe au-delà de 25 fiches sans en perdre', async () => {
    const run = await runClassification(llmClassifying(), {
      fiches: toFiches(26),
    });
    expect(run.kind === 'completed' && run.draft.fiches).toHaveLength(26);
  });

  it('cumule les jetons de tous les lots', async () => {
    const run = await runClassification(llmClassifying(), {
      fiches: toFiches(FICHES_PER_BATCH * 2),
    });
    expect(run.kind === 'completed' && run.tokens.totalTokens).toBe(
      tokens.totalTokens * 2
    );
  });

  it('conserve les lots réussis quand un lot échoue', async () => {
    const run = await runClassification(llmFailingOnBatch([0]), {
      fiches: toFiches(FICHES_PER_BATCH * 3),
    });
    expect(run.kind === 'completed' && run.draft.fiches).toHaveLength(
      FICHES_PER_BATCH * 2
    );
  });

  it('inscrit les fiches du lot en échec dans unclassified, avec leur raison', async () => {
    const run = await runClassification(llmFailingOnBatch([0]), {
      fiches: toFiches(FICHES_PER_BATCH * 3),
    });
    expect(
      run.kind === 'completed' && run.draft.unclassified.slice(0, 2)
    ).toEqual([
      { ficheId: 1, reason: 'truncated' },
      { ficheId: 2, reason: 'truncated' },
    ]);
  });

  it('abandonne au-delà de la moitié des lots en échec', async () => {
    const run = await runClassification(llmFailingOnBatch([0, 1, 2]), {
      fiches: toFiches(FICHES_PER_BATCH * 4),
    });
    expect(run).toEqual({
      kind: 'too_many_failed_batches',
      failedBatches: 3,
      totalBatches: 4,
    });
  });

  it('accepte exactement la moitié des lots en échec', async () => {
    const run = await runClassification(llmFailingOnBatch([0, 1]), {
      fiches: toFiches(FICHES_PER_BATCH * 4),
    });
    expect(run.kind).toBe('completed');
  });

  it('signale la progression après chaque lot', async () => {
    const progression: number[] = [];
    await runClassification(llmClassifying(), {
      fiches: toFiches(FICHES_PER_BATCH * 3),
      onBatchProcessed: (processedBatches) =>
        progression.push(processedBatches),
    });
    expect(progression).toEqual([1, 2, 3]);
  });
});
