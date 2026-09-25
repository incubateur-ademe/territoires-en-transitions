import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { buildDocument, buildPage } from './document/document-page';
import {
  PipelineLlm,
  RunImportPipelineInput,
  runImportPipeline,
  StepName,
  StepStates,
} from './run-import-pipeline';

const tokens: TokenUsage = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const stepOf = (prompt: string): StepName => {
  if (prompt.includes('agent de tri documentaire')) return 'scouting';
  if (prompt.includes('squelette du plan')) return 'scouting';
  if (prompt.includes('auditeur qualité')) return 'qualitativeReview';
  if (prompt.includes("agent d'enrichissement")) return 'enrichment';
  if (prompt.includes('Actions ciblées à traiter')) return 'consolidation';
  if (prompt.includes('agent de validation')) return 'scoring';
  return 'extraction';
};

// Seules les étapes qui interrogent le modèle ont une réponse.
const responseByStep: Partial<Record<StepName, unknown>> = {
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

const routedLlm = (failingStep?: StepName): PipelineLlm =>
  ({
    maxInputTokens: 900_000,
    capabilities: { ocr: false, strategy: 'whole-document' },
    generateStructured: vi.fn(async ({ prompt }: { prompt: string }) => {
      const step = stepOf(prompt);
      if (step === failingStep) {
        return failure({ kind: 'rate_limited' });
      }
      if (step === 'scouting') {
        return success({
          data: prompt.includes('squelette du plan')
            ? { axes: [{ numero: '1', titre: 'Bâtiments', sousAxes: [] }] }
            : [
                { index: 0, type: 'fiche_action' },
                { index: 1, type: 'diagnostic' },
              ],
          tokens,
        });
      }
      return success({ data: responseByStep[step], tokens });
    }),
  } as unknown as PipelineLlm);

const documentOf = (text: string) =>
  buildDocument('pdf', [buildPage(0, [{ text }])]);

const input = (
  overrides: Partial<RunImportPipelineInput> = {}
): RunImportPipelineInput => ({
  document: documentOf('texte source'),
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
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
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

  it('émet la progression cumulée après chaque étape', async () => {
    const llm = routedLlm();
    const onStepStatesChange = vi.fn<(stepStates: StepStates) => Promise<void>>(
      async () => {}
    );

    await runImportPipeline(llm, input({ onStepStatesChange }));

    const reportedStates = onStepStatesChange.mock.calls.map(
      ([states]) => states
    );
    expect(reportedStates).toEqual([
      {
        reading: 'ok',
        scouting: 'pending',
        extraction: 'pending',
        hierarchy: 'pending',
        scoring: 'pending',
        consolidation: 'pending',
        enrichment: 'pending',
        qualitativeReview: 'pending',
      },
      {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'pending',
        hierarchy: 'pending',
        scoring: 'pending',
        consolidation: 'pending',
        enrichment: 'pending',
        qualitativeReview: 'pending',
      },
      {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'pending',
        consolidation: 'pending',
        enrichment: 'pending',
        qualitativeReview: 'pending',
      },
      {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'ok',
        consolidation: 'pending',
        enrichment: 'pending',
        qualitativeReview: 'pending',
      },
      {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'ok',
        consolidation: 'ok',
        enrichment: 'pending',
        qualitativeReview: 'pending',
      },
      {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'ok',
        consolidation: 'ok',
        enrichment: 'ok',
        qualitativeReview: 'pending',
      },
      {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'ok',
        consolidation: 'ok',
        enrichment: 'ok',
        qualitativeReview: 'ok',
      },
    ]);
  });

  it('structure chaque fiche à part avec la stratégie segmentée, puis vérifie par fenêtres', async () => {
    const llm = routedLlm();
    (llm as { capabilities: unknown }).capabilities = {
      ocr: false,
      strategy: 'segmented',
    };
    const document = buildDocument('pdf', [
      buildPage(0, [
        { text: 'Axe 1 : Bâtiments' },
        { text: 'Action 1.1.1 : Isoler' },
        { text: 'Pilote : Service' },
      ]),
      buildPage(1, [
        { text: 'Action 1.1.2 : Rénover' },
        { text: 'Budget : 10' },
      ]),
    ]);

    const outcome = await runImportPipeline(
      llm,
      input({ document, withSousActions: false })
    );

    const prompts = vi
      .mocked(llm.generateStructured)
      .mock.calls.map(([args]) => (args as { prompt: string }).prompt);
    // L'axe seul est trop court pour vivre seul : il rejoint la première
    // fiche. Deux unités, deux structurations, puis une seule fenêtre de
    // contrôle.
    expect(
      prompts.filter((p) => p.includes('agent de tri documentaire'))
    ).toHaveLength(1);
    expect(prompts.filter((p) => p.includes('squelette du plan'))).toHaveLength(
      1
    );
    expect(
      prompts.filter((p) => p.includes('Extrait à structurer'))
    ).toHaveLength(2);
    // Le squelette relevé est cité à chaque structuration.
    expect(prompts.find((p) => p.includes('Extrait à structurer'))).toContain(
      'Axe 1 : Bâtiments'
    );
    expect(
      prompts.filter((p) => p.includes('agent de validation'))
    ).toHaveLength(1);
    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.stepStates.reading).toBe('ok');
      expect(outcome.stepStates.scouting).toBe('ok');
      expect(outcome.draft.actions).toHaveLength(1);
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
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'pending',
        consolidation: 'pending',
        enrichment: 'pending',
        qualitativeReview: 'pending',
      },
    });
    expect(llm.generateStructured).toHaveBeenCalledTimes(2);
  });
});
