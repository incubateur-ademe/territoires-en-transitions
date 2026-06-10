import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  createUnenrichedSousAction,
  ExtractedAction,
} from '../../models/extracted-action';
import {
  ENRICHMENT_BATCH_SIZE,
  enrichSousActions,
} from './enrich-sous-actions';

const tokens: TokenUsage = {
  promptTokens: 10,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const anAction = (
  titre: string,
  sousActionTitres: string[]
): ExtractedAction => ({
  axe: 'Axe 1',
  sousAxe: '1.1',
  titre,
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: sousActionTitres.map(createUnenrichedSousAction),
});

const echoingLlm = (): Pick<LlmService, 'generateStructured'> =>
  ({
    generateStructured: vi.fn(async ({ prompt }: { prompt: string }) => {
      const indices = [
        ...prompt.matchAll(/(\d+) \| \[Action parente/g),
      ].map((match) => Number(match[1]));
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
  it('ne fait aucun appel LLM quand aucune action n\'a de sous-action', async () => {
    const llm = echoingLlm();

    const result = await enrichSousActions(llm, {
      actions: [anAction('Action A', []), anAction('Action B', [])],
      text: 'texte',
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
      actions: [anAction('Action A', sousActionTitres)],
      text: 'texte',
      disabledFields: [],
    });

    expect(llm.generateStructured).toHaveBeenCalledTimes(2);
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
      actions: [anAction('Action A', ['a0', 'a1'])],
      text: 'texte',
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

  it('échoue si un lot échoue', async () => {
    const llm = {
      generateStructured: async () => failure({ kind: 'rate_limited' }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await enrichSousActions(llm, {
      actions: [anAction('Action A', ['a0'])],
      text: 'texte',
      disabledFields: [],
    });

    expect(result).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
