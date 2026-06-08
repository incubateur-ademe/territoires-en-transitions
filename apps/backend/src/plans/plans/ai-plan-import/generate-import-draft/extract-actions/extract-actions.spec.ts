import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { extractActions } from './extract-actions';
import { ExtractionAction, ExtractionResponse } from './extract-actions.schema';

const tokens: TokenUsage = {
  promptTokens: 100,
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
  text: 'texte source',
  precisions: '',
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
