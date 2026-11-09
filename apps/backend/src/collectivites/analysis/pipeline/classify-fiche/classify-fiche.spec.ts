import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { classifyFiche } from './classify-fiche';
import { FICHE_CLASSIFICATION_SYSTEM_INSTRUCTION } from './classify-fiche.prompt';
import {
  FicheClassification,
  ficheClassificationSchema,
} from './classify-fiche.schema';
import { FicheToClassify } from './render-fiche-text';

const fiche: FicheToClassify = {
  ficheId: 7,
  titre: 'Expérimenter l’autopartage',
  description: null,
  axePaths: [['PCAET', 'Mobilité']],
};

const tokens: TokenUsage = {
  promptTokens: 11050,
  cachedTokens: 11000,
  candidatesTokens: 20,
  thoughtsTokens: 0,
  totalTokens: 11070,
};

const buildLlm = (
  response:
    | { data: FicheClassification }
    | { error: LlmError }
) => {
  const generateStructured = vi.fn(async () =>
    'data' in response
      ? success({ data: response.data, tokens })
      : failure(response.error)
  );
  return {
    generateStructured,
    llm: { generateStructured } as unknown as Pick<
      LlmService,
      'generateStructured'
    >,
  };
};

describe('classifyFiche', () => {
  it('envoie la fiche balisée, le prompt système, le schéma et le plafond de sortie', async () => {
    const { llm, generateStructured } = buildLlm({ data: { leviers: [] } });

    await classifyFiche(llm, { fiche, nonce: 'abc' });

    expect(generateStructured).toHaveBeenCalledWith({
      prompt: [
        '<fiche nonce="abc">',
        'Contexte : PCAET > Mobilité',
        'Titre : Expérimenter l’autopartage',
        'Description : aucune',
        '</fiche>',
      ].join('\n'),
      systemInstruction: FICHE_CLASSIFICATION_SYSTEM_INSTRUCTION,
      schema: ficheClassificationSchema,
      maxOutputTokens: 1024,
      timeoutMs: 60_000,
      signal: undefined,
    });
  });

  it('rend la fiche classée et la consommation de tokens', async () => {
    const { llm } = buildLlm({
      data: { leviers: [{ levier: 'covoiturage', categories: [1] }] },
    });

    expect(await classifyFiche(llm, { fiche })).toEqual({
      success: true,
      data: {
        fiche: {
          ficheId: 7,
          isDescriptionTruncated: false,
          volets: [{ levier: 'Covoiturage', categorie: 'amenagement' }],
        },
        tokens,
      },
    });
  });

  it('rend une fiche sans volet quand aucun levier ne convient', async () => {
    const { llm } = buildLlm({ data: { leviers: [] } });

    expect(await classifyFiche(llm, { fiche })).toMatchObject({
      success: true,
      data: { fiche: { ficheId: 7, volets: [] } },
    });
  });

  it('renvoie l’erreur du fournisseur sans la modifier', async () => {
    const { llm } = buildLlm({ error: { kind: 'rate_limited' } });

    expect(await classifyFiche(llm, { fiche })).toEqual({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });

  it('tire un nonce différent à chaque appel quand aucun n’est donné', async () => {
    const { llm, generateStructured } = buildLlm({ data: { leviers: [] } });

    await classifyFiche(llm, { fiche });
    await classifyFiche(llm, { fiche });

    const [firstCall, secondCall] = generateStructured.mock.calls as unknown as [
      [{ prompt: string }],
      [{ prompt: string }]
    ];
    expect(firstCall[0].prompt.split('\n')[0]).not.toBe(
      secondCall[0].prompt.split('\n')[0]
    );
  });
});
