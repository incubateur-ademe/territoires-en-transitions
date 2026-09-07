import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import {
  GenerateStructuredArgs,
  LlmService,
} from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { ZodType } from 'zod';
import { classifyFiches, MAX_FICHES_PER_BATCH } from './classify-fiches';
import { FicheClassification } from './classify-fiches.schema';
import { FicheToClassify } from './render-fiches-text';

const tokens = {
  promptTokens: 10,
  candidatesTokens: 5,
  thoughtsTokens: 0,
  totalTokens: 15,
};

type LlmAnswer = Awaited<ReturnType<LlmService['generateStructured']>>;

type CapturedLlm = {
  llm: Pick<LlmService, 'generateStructured'>;
  calls: GenerateStructuredArgs<ZodType>[];
};

const llmAnswering = (answer: LlmAnswer): CapturedLlm => {
  const calls: GenerateStructuredArgs<ZodType>[] = [];
  const generateStructured = async (
    args: GenerateStructuredArgs<ZodType>
  ): Promise<LlmAnswer> => {
    calls.push(args);
    return answer;
  };
  return {
    llm: { generateStructured } as unknown as Pick<
      LlmService,
      'generateStructured'
    >,
    calls,
  };
};

const classifying = (classifications: FicheClassification[]): CapturedLlm =>
  llmAnswering(success({ data: classifications, tokens }));

const failingWith = (error: LlmError): CapturedLlm =>
  llmAnswering(failure(error));

const fiches: FicheToClassify[] = [
  { ficheId: 42, titre: 'Aire de covoiturage', description: 'Vingt places' },
];

const classifications: FicheClassification[] = [
  {
    index: 0,
    justification: 'Le texte décrit une infrastructure de covoiturage.',
    hasNoRelevantLevier: false,
    volets: [{ levier: 'Covoiturage', categories: ['amenagement'] }],
  },
];

const input = { fiches, nonce: 'nonce-de-test' };

describe('classifyFiches', () => {
  it('rend les fiches classées accompagnées de la consommation de jetons', async () => {
    const { llm } = classifying(classifications);
    const result = await classifyFiches(llm, input);
    expect(result).toEqual({
      success: true,
      data: {
        tokens,
        fiches: [
          {
            ficheId: 42,
            justification: 'Le texte décrit une infrastructure de covoiturage.',
            isDescriptionTruncated: false,
            volets: [
              {
                levier: 'Covoiturage',
                secteur: 'Transports',
                categorie: 'amenagement',
              },
            ],
          },
        ],
      },
    });
  });

  it('soumet le texte des fiches balisé avec le nonce demandé', async () => {
    const { llm, calls } = classifying(classifications);
    await classifyFiches(llm, input);
    expect(calls[0].prompt).toContain(
      '<action index="0" nonce="nonce-de-test">'
    );
  });

  it('demande un budget de raisonnement de 512 jetons', async () => {
    const { llm, calls } = classifying(classifications);
    await classifyFiches(llm, input);
    expect(calls[0].thinkingBudget).toBe(512);
  });

  it("transmet le signal d'annulation au modèle", async () => {
    const { llm, calls } = classifying(classifications);
    const signal = AbortSignal.abort();
    await classifyFiches(llm, { ...input, signal });
    expect(calls[0].signal).toBe(signal);
  });

  it('propage une erreur du modèle sans la transformer', async () => {
    const { llm } = failingWith({ kind: 'truncated' });
    expect(await classifyFiches(llm, input)).toEqual({
      success: false,
      error: { kind: 'truncated' },
    });
  });

  it("propage l'incohérence détectée dans la réponse du modèle", async () => {
    const { llm } = classifying([{ ...classifications[0], index: 99 }]);
    expect(await classifyFiches(llm, input)).toEqual({
      success: false,
      error: { kind: 'unexpected_index', index: 99 },
    });
  });

  it('refuse un lot vide sans interroger le modèle', async () => {
    const { llm, calls } = classifying(classifications);
    const result = await classifyFiches(llm, { ...input, fiches: [] });
    expect({ result, callCount: calls.length }).toEqual({
      result: { success: false, error: { kind: 'empty_batch' } },
      callCount: 0,
    });
  });

  it('refuse un lot de 51 fiches sans interroger le modèle', async () => {
    const { llm, calls } = classifying(classifications);
    const oversizedBatch = Array.from(
      { length: MAX_FICHES_PER_BATCH + 1 },
      (unused, ficheId) => ({ ficheId, titre: 'Titre', description: null })
    );
    const result = await classifyFiches(llm, {
      ...input,
      fiches: oversizedBatch,
    });
    expect({ result, callCount: calls.length }).toEqual({
      result: {
        success: false,
        error: { kind: 'batch_too_large', count: MAX_FICHES_PER_BATCH + 1 },
      },
      callCount: 0,
    });
  });
});
