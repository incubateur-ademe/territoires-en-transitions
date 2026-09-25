import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { extractActions } from './extract-actions';
import { ExtractionAction, ExtractionResponse } from './extract-actions.schema';

const tokens: TokenUsage = {
  promptTokens: 100,
  cachedTokens: 0,
  candidatesTokens: 50,
  thoughtsTokens: 10,
  totalTokens: 160,
};

const anExtractionAction = (
  overrides: Partial<ExtractionAction> = {}
): ExtractionAction => ({
  axe: 'Axe 1 Gouvernance',
  'sous-axe': '1.1 Pilotage',
  titre: '1.1.1 Définir un portage politique',
  description: '',
  'sous-actions': [],
  objectifs: '',
  'structure pilote': '',
  'direction ou service pilote': '',
  'personne pilote': '',
  budget: '',
  statut: '',
  ...overrides,
});

const llmReturning = (
  result: Result<{ data: ExtractionResponse; tokens: TokenUsage }, never>
): Pick<LlmService, 'generateStructured'> =>
  ({
    generateStructured: async () => result,
  } as unknown as Pick<LlmService, 'generateStructured'>);

const promptInput = {
  chunks: ['texte source'],
  instructions: '',
  disabledFields: [],
  currentDate: '08/06/2026',
};

describe('extractActions', () => {
  it('mappe la réponse du LLM en actions et propage les tokens', async () => {
    const llm = llmReturning(
      success({ data: [anExtractionAction({ budget: '5000' })], tokens })
    );

    const result = await extractActions(llm, promptInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions).toHaveLength(1);
      expect(result.data.actions[0].budget).toBe(5000);
      expect(result.data.tokens).toEqual(tokens);
    }
  });

  it('échoue explicitement quand aucune action n est extraite', async () => {
    const llm = llmReturning(success({ data: [], tokens }));

    const result = await extractActions(llm, promptInput);

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'no_actions_extracted' },
    });
  });

  it("extrait les tranches en série, chacune avec l'axe où s'arrête la précédente", async () => {
    const prompts: string[] = [];
    const responses = [
      [anExtractionAction({ axe: 'Axe 2 Mobilité', titre: '2.1.1 Vélo' })],
      [],
      [anExtractionAction({ axe: 'Axe 3 Énergie', titre: '3.1.1 Solaire' })],
    ];
    const llm = {
      generateStructured: async ({ prompt }: { prompt: string }) => {
        prompts.push(prompt);
        return success({ data: responses[prompts.length - 1], tokens });
      },
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await extractActions(llm, {
      ...promptInput,
      chunks: ['tranche A', 'tranche B', 'tranche C'],
    });

    expect(prompts).toHaveLength(3);
    expect(prompts[0]).not.toContain('Extrait 1');
    expect(prompts[1]).toContain('Extrait 2 sur 3');
    expect(prompts[1]).toContain('« Axe 2 Mobilité »');
    expect(prompts[1]).toContain('« 2.1.1 Vélo »');
    expect(result.success).toBe(true);
    if (result.success) {
      // Une tranche sans action (tranche B) n'est pas une erreur.
      expect(result.data.actions.map((action) => action.titre)).toEqual([
        '2.1.1 Vélo',
        '3.1.1 Solaire',
      ]);
      expect(result.data.chunkIndexByAction).toEqual([0, 2]);
      expect(result.data.tokens.totalTokens).toBe(tokens.totalTokens * 3);
    }
  });

  it("échoue quand aucune tranche ne contient d'action", async () => {
    const llm = llmReturning(success({ data: [], tokens }));

    const result = await extractActions(llm, {
      ...promptInput,
      chunks: ['tranche A', 'tranche B'],
    });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'no_actions_extracted' },
    });
  });

  it('propage l erreur du LLM', async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'rate_limited' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await extractActions(llm, promptInput);

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
