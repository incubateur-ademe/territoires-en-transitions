import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  createUnenrichedSousAction,
  createEmptyExtractedAction,
  ExtractedAction,
} from '../../models/extracted-action';
import {
  ENRICHMENT_BATCH_SIZE,
  enrichSousActions,
} from './enrich-sous-actions';
import { wholeDocument } from '../source-chunks/source-chunks';

const inWholeDocument = (actions: ExtractedAction[]) => ({
  actions,
  source: wholeDocument('texte', actions.length),
});

const tokens: TokenUsage = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const toAction = (titre: string, sousActionTitres: string[]): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre,
    sousActions: sousActionTitres.map(createUnenrichedSousAction),
  });

const echoingLlm = (): Pick<LlmService, 'generateStructured'> =>
  ({
    generateStructured: vi.fn(async ({ prompt }: { prompt: string }) => {
      const indices = [...prompt.matchAll(/(\d+) \| \[Action parente/g)].map(
        (match) => Number(match[1])
      );
      return success({
        data: indices.map((index) => ({
          index,
          description: `enrichie ${index}`,
          personne_pilote: '',
          statut: '',
          date_debut: '',
          date_fin: '',
        })),
        tokens,
      });
    }),
  } as unknown as Pick<LlmService, 'generateStructured'>);

describe('enrichSousActions', () => {
  it("ne fait aucun appel LLM quand aucune action n'a de sous-action", async () => {
    const llm = echoingLlm();

    const result = await enrichSousActions(llm, {
      ...inWholeDocument([toAction('Action A', []), toAction('Action B', [])]),
      disabledFields: [],
    });

    expect(llm.generateStructured).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true });
    if (result.success) {
      expect(result.data.tokens.totalTokens).toBe(0);
    }
  });

  it('enrichit les sous-actions sur plusieurs lots et somme les tokens', async () => {
    const count = ENRICHMENT_BATCH_SIZE + 2;
    const sousActionTitres = Array.from(
      { length: count },
      (_, index) => `sa ${index}`
    );
    const llm = echoingLlm();

    const result = await enrichSousActions(llm, {
      ...inWholeDocument([toAction('Action A', sousActionTitres)]),
      disabledFields: [],
    });

    expect(llm.generateStructured).toHaveBeenCalledTimes(2);
    expect(llm.generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({ thinkingLevel: 'low' })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      result.data.actions[0].sousActions.forEach((sousAction, index) => {
        expect(sousAction.description).toBe(`enrichie ${index}`);
      });
      expect(result.data.tokens.totalTokens).toBe(tokens.totalTokens * 2);
    }
  });

  it("ignore une entrée dont l'index n'appartient pas au lot demandé", async () => {
    const llm = {
      generateStructured: async () =>
        success({
          data: [
            {
              index: 0,
              description: 'enrichie 0',
              personne_pilote: '',
              statut: '',
              date_debut: '',
              date_fin: '',
            },
            {
              index: 99,
              description: 'CORROMPU',
              personne_pilote: '',
              statut: '',
              date_debut: '',
              date_fin: '',
            },
          ],
          tokens,
        }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await enrichSousActions(llm, {
      ...inWholeDocument([toAction('Action A', ['a0', 'a1'])]),
      disabledFields: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions[0].sousActions[0].description).toBe(
        'enrichie 0'
      );
      expect(result.data.actions[0].sousActions[1].description).toBeNull();
    }
  });

  it("garde telles qu'extraites les sous-actions d'un lot en échec, avec un avertissement", async () => {
    const echoing = echoingLlm();
    const llm = {
      generateStructured: vi
        .fn()
        .mockResolvedValueOnce(failure({ kind: 'api_error', httpStatus: 503 }))
        .mockImplementation(echoing.generateStructured),
    } as unknown as Pick<LlmService, 'generateStructured'>;
    const sousActionTitres = Array.from(
      { length: ENRICHMENT_BATCH_SIZE + 2 },
      (_, index) => `sa ${index}`
    );

    const result = await enrichSousActions(llm, {
      ...inWholeDocument([toAction('Action A', sousActionTitres)]),
      disabledFields: [],
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        warnings: [
          `Sous-actions non enrichies pour ${ENRICHMENT_BATCH_SIZE} sous-action(s) : api_error 503`,
        ],
        details: { batches: 2, failedBatches: 1 },
        tokens: { totalTokens: tokens.totalTokens },
      },
    });
    if (result.success) {
      const { sousActions } = result.data.actions[0];
      expect(sousActions[0]).toMatchObject({
        titre: 'sa 0',
        description: null,
      });
      expect(sousActions[ENRICHMENT_BATCH_SIZE].description).toBe(
        `enrichie ${ENRICHMENT_BATCH_SIZE}`
      );
    }
  });

  it('échoue quand tous les lots butent sur le quota', async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'rate_limited' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await enrichSousActions(llm, {
      ...inWholeDocument([toAction('Action A', ['a0'])]),
      disabledFields: [],
    });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });

  it('envoie à chaque lot la tranche de ses actions parentes', async () => {
    const llm = echoingLlm();

    const result = await enrichSousActions(llm, {
      actions: [toAction('Action A', ['a0']), toAction('Action B', ['b0'])],
      source: {
        chunks: ['TRANCHE_0', 'TRANCHE_1'],
        chunkIndexByAction: [0, 1],
      },
      disabledFields: [],
    });

    const prompts = vi
      .mocked(llm.generateStructured)
      .mock.calls.map(([args]) => (args as { prompt: string }).prompt);
    const promptOf = (titre: string) =>
      prompts.find((prompt) => prompt.includes(titre));
    expect(prompts).toHaveLength(2);
    expect(promptOf('Action A')).toContain('TRANCHE_0');
    expect(promptOf('Action B')).toContain('TRANCHE_1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions[1].sousActions[0].description).toBe(
        'enrichie 1'
      );
    }
  });
});
