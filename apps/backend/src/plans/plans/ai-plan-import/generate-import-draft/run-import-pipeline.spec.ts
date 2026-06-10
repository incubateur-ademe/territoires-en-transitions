import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  RunImportPipelineInput,
  runImportPipeline,
  StepName,
} from './run-import-pipeline';

const tokens: TokenUsage = {
  promptTokens: 10,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const stepOf = (prompt: string): StepName => {
  if (prompt.includes('auditeur qualité')) return 'qualitativeReview';
  if (prompt.includes("agent d'enrichissement")) return 'enrichment';
  if (prompt.includes('Actions ciblées à traiter')) return 'consolidation';
  if (prompt.includes('agent de validation')) return 'scoring';
  return 'extraction';
};

const responseByStep: Record<StepName, unknown> = {
  extraction: [
    {
      axe: 'Axe 1',
      'sous-axe': '1.1',
      titre: '1.1.1 Action',
      description: '',
      'sous-actions': ['Sous action A'],
      objectifs: '',
      'structure pilote': '',
      'direction ou service pilote': '',
      'personne pilote': '',
      budget: '',
      statut: '',
    },
  ],
  scoring: [{ index: 0, score: 80, explication: 'ok' }],
  consolidation: [
    {
      index: 0,
      titre: 'Action consolidée',
      description: '',
      'sous-actions': ['Sous action A'],
    },
  ],
  enrichment: [
    {
      index: 0,
      description: 'desc enrichie',
      personne_pilote: '',
      statut: '',
      date_debut: '',
      date_fin: '',
    },
  ],
  qualitativeReview: { avis: 'Extraction cohérente' },
};

const routedLlm = (
  failingStep?: StepName
): Pick<LlmService, 'generateStructured'> =>
  ({
    generateStructured: vi.fn(async ({ prompt }: { prompt: string }) => {
      const step = stepOf(prompt);
      if (step === failingStep) {
        return failure({ kind: 'rate_limited' });
      }
      return success({ data: responseByStep[step], tokens });
    }),
  } as unknown as Pick<LlmService, 'generateStructured'>);

const input = (
  overrides: Partial<RunImportPipelineInput> = {}
): RunImportPipelineInput => ({
  text: 'texte source',
  instructions: '',
  disabledFields: [],
  currentDate: '2026-06-10',
  withVerifications: true,
  withSousActions: true,
  ...overrides,
});

describe('runImportPipeline', () => {
  it('exécute les 5 étapes et renvoie un brouillon', async () => {
    const llm = routedLlm();

    const outcome = await runImportPipeline(llm, input());

    expect(llm.generateStructured).toHaveBeenCalledTimes(5);
    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      const [action] = outcome.draft.actions;
      expect(action.titre).toBe('Action consolidée');
      expect(action.confidence?.amelioree).toBe(true);
      expect(action.sousActions[0].description).toBe('desc enrichie');
      expect(outcome.draft.qualitativeReview).toBe('Extraction cohérente');
      expect(outcome.stepStates).toEqual({
        extraction: 'ok',
        scoring: 'ok',
        consolidation: 'ok',
        enrichment: 'ok',
        qualitativeReview: 'ok',
      });
      expect(outcome.tokens.totalTokens).toBe(tokens.totalTokens * 5);
    }
  });

  it('saute scoring et consolidation quand withVerifications est faux', async () => {
    const llm = routedLlm();

    const outcome = await runImportPipeline(
      llm,
      input({ withVerifications: false })
    );

    expect(llm.generateStructured).toHaveBeenCalledTimes(3);
    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.draft.actions[0].titre).toBe('1.1.1 Action');
      expect(outcome.draft.actions[0].confidence).toBeNull();
      expect(outcome.draft.actions[0].sousActions[0].description).toBe(
        'desc enrichie'
      );
      expect(outcome.stepStates.scoring).toBe('skipped');
      expect(outcome.stepStates.consolidation).toBe('skipped');
      expect(outcome.stepStates.enrichment).toBe('ok');
    }
  });

  it('saute enrichissement et vide les sous-actions quand withSousActions est faux', async () => {
    const llm = routedLlm();

    const outcome = await runImportPipeline(
      llm,
      input({ withSousActions: false })
    );

    expect(llm.generateStructured).toHaveBeenCalledTimes(4);
    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.draft.actions[0].sousActions).toEqual([]);
      expect(outcome.stepStates.enrichment).toBe('skipped');
    }
  });

  it('échoue à la première étape qui échoue, sans brouillon', async () => {
    const llm = routedLlm('scoring');

    const outcome = await runImportPipeline(llm, input());

    expect(outcome).toMatchObject({
      status: 'failed',
      failedStep: 'scoring',
      error: { kind: 'rate_limited' },
      stepStates: {
        extraction: 'ok',
        scoring: 'pending',
        consolidation: 'pending',
        enrichment: 'pending',
        qualitativeReview: 'pending',
      },
    });
    expect(llm.generateStructured).toHaveBeenCalledTimes(2);
  });
});
