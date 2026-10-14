import { currentLlmCallRecorder } from '@tet/backend/utils/llm/llm-call-recorder';
import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import type { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ImportStepRun } from '../models/import-step-run';
import {
  buildDocument,
  buildPage,
  type ReadDocument,
} from './document/document-page';
import type { PipelineCheckpoint } from './pipeline-checkpoint';
import {
  isCheckpointUsableBy,
  PipelineLlm,
  RunImportPipelineInput,
  runImportPipeline,
  StepName,
  StepStates,
  stepStatesSchema,
} from './run-import-pipeline';

const stepOrder = stepStatesSchema.keyof().options;

const tokens: TokenUsage = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const stepOf = (prompt: string): StepName => {
  if (prompt.includes('agent de classement des actions')) return 'secteurs';
  if (prompt.includes('agent de tri documentaire')) return 'scouting';
  if (prompt.includes('squelette du plan')) return 'scouting';
  if (prompt.includes('agent de mise en cohérence')) return 'hierarchy';
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
      partenaires: '',
      budget: '',
      financements: '',
      'moyens humains': '',
      priorite: '',
      'date de debut': '',
      'date de fin': '',
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
  secteurs: [
    { index: 0, secteurs: ['tertiaire'], justification: 'Bâtiments publics.' },
  ],
  qualitativeReview: { avis: 'Extraction cohérente' },
};

const routedLlm = (
  failingStep?: StepName,
  error: LlmError = { kind: 'rate_limited' }
): PipelineLlm =>
  ({
    maxInputTokens: 900_000,
    capabilities: { ocr: false, strategy: 'whole-document' },
    generateStructured: vi.fn(async ({ prompt }: { prompt: string }) => {
      const step = stepOf(prompt);
      if (step === failingStep) {
        return failure(error);
      }
      if (step === 'hierarchy') {
        return success({
          data: [
            {
              index: 0,
              axe: 'Axe 1 : Bâtiments',
              'sous-axe': '',
              doublonDe: -1,
            },
          ],
          tokens,
        });
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

type FreshInput = Extract<RunImportPipelineInput, { document: ReadDocument }>;

const input = (overrides: Partial<FreshInput> = {}): FreshInput => ({
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
        secteurs: 'skipped',
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
    expect(reportedStates.slice(0, 6)).toEqual([
      {
        reading: 'ok',
        scouting: 'pending',
        extraction: 'pending',
        hierarchy: 'pending',
        scoring: 'pending',
        consolidation: 'pending',
        enrichment: 'pending',
        secteurs: 'pending',
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
        secteurs: 'pending',
        qualitativeReview: 'pending',
      },
      {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'pending',
        scoring: 'pending',
        consolidation: 'pending',
        enrichment: 'pending',
        secteurs: 'pending',
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
        secteurs: 'pending',
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
        secteurs: 'pending',
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
        secteurs: 'pending',
        qualitativeReview: 'pending',
      },
    ]);
    // Après la consolidation, les deux branches avancent chacune de leur
    // côté : une étape de plus à chaque fois, jusqu'à l'état final.
    const parallel = reportedStates.slice(6);
    expect(parallel).toHaveLength(3);
    parallel.forEach((states, index) => {
      const previous = reportedStates[5 + index];
      const changed = stepOrder.filter(
        (name) => states[name] !== previous[name]
      );
      expect(changed).toHaveLength(1);
      expect(previous[changed[0]]).toBe('pending');
    });
    expect(parallel.at(-1)).toEqual({
      reading: 'ok',
      scouting: 'skipped',
      extraction: 'ok',
      hierarchy: 'skipped',
      scoring: 'ok',
      consolidation: 'ok',
      enrichment: 'ok',
      secteurs: 'skipped',
      qualitativeReview: 'ok',
    });
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
    // fiche. Les deux unités tiennent dans un seul appel de structuration,
    // puis une seule fenêtre de contrôle.
    expect(
      prompts.filter((p) => p.includes('agent de tri documentaire'))
    ).toHaveLength(1);
    expect(prompts.filter((p) => p.includes('squelette du plan'))).toHaveLength(
      1
    );
    expect(
      prompts.filter((p) => p.includes('Extrait à structurer'))
    ).toHaveLength(1);
    // Le squelette relevé est cité à chaque structuration.
    expect(prompts.find((p) => p.includes('Extrait à structurer'))).toContain(
      'Axe 1 : Bâtiments'
    );
    expect(
      prompts.filter((p) => p.includes('agent de validation'))
    ).toHaveLength(1);
    expect(outcome.status).toBe('done');
    expect(
      prompts.filter((p) => p.includes('agent de mise en cohérence'))
    ).toHaveLength(1);
    if (outcome.status === 'done') {
      expect(outcome.stepStates.reading).toBe('ok');
      expect(outcome.stepStates.scouting).toBe('ok');
      expect(outcome.stepStates.hierarchy).toBe('ok');
      expect(outcome.draft.actions).toHaveLength(1);
      expect(outcome.draft.actions[0].axe).toBe('Axe 1 : Bâtiments');
    }
  });

  it('échoue à la première étape qui échoue, en gardant les actions déjà extraites', async () => {
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
    if (outcome.status === 'failed') {
      expect(outcome.partialDraft.actions.length).toBeGreaterThan(0);
    }
  });

  it('rend compte de chaque étape : durée, statut, comptes, et étape en échec', async () => {
    const runs: ImportStepRun[] = [];
    const onStepRun = vi.fn(async (run: ImportStepRun) => {
      runs.push(run);
    });

    await runImportPipeline(routedLlm('consolidation'), input({ onStepRun }));

    expect(
      runs.map(({ step, status, error }) => ({ step, status, error }))
    ).toEqual([
      { step: 'reading', status: 'ok', error: null },
      { step: 'scouting', status: 'skipped', error: null },
      { step: 'extraction', status: 'ok', error: null },
      { step: 'hierarchy', status: 'skipped', error: null },
      { step: 'scoring', status: 'ok', error: null },
      { step: 'consolidation', status: 'failed', error: 'rate_limited' },
    ]);
    expect(runs[2].details).toMatchObject({ actionsIn: 0, actionsOut: 1 });
    for (const run of runs) {
      expect(run.endedAt.getTime()).toBeGreaterThanOrEqual(
        run.startedAt.getTime()
      );
    }
  });

  it("décrit l'erreur de l'étape en échec avec son statut HTTP", async () => {
    const runs: ImportStepRun[] = [];
    const onStepRun = vi.fn(async (run: ImportStepRun) => {
      runs.push(run);
    });

    await runImportPipeline(
      routedLlm('extraction', { kind: 'api_error', httpStatus: 503 }),
      input({ onStepRun })
    );

    expect(runs.at(-1)).toMatchObject({
      step: 'extraction',
      status: 'failed',
      error: 'api_error 503',
    });
  });

  it.each([
    'scoring',
    'consolidation',
    'enrichment',
    'qualitativeReview',
  ] as const)(
    "va au bout quand l'étape %s échoue sur autre chose que le quota",
    async (failingStep) => {
      const runs: ImportStepRun[] = [];

      const outcome = await runImportPipeline(
        routedLlm(failingStep, { kind: 'api_error', httpStatus: 503 }),
        input({
          onStepRun: async (run) => {
            runs.push(run);
          },
        })
      );

      expect(outcome).toMatchObject({
        status: 'done',
        stepStates: { [failingStep]: 'ok' },
        warnings: [expect.stringContaining('api_error 503')],
      });
      expect(runs.find(({ step }) => step === failingStep)).toMatchObject({
        status: 'ok',
        details: { failedBatches: 1 },
      });
    }
  );

  it('rend un brouillon sans relecture quand la relecture échoue', async () => {
    const outcome = await runImportPipeline(
      routedLlm('qualitativeReview', { kind: 'truncated' }),
      input()
    );

    expect(outcome).toMatchObject({
      status: 'done',
      draft: { qualitativeReview: null },
    });
  });

  it('propose les secteurs de chaque action quand withSecteurs est vrai', async () => {
    const outcome = await runImportPipeline(
      routedLlm(),
      input({ withSecteurs: true })
    );

    expect(outcome).toMatchObject({
      status: 'done',
      stepStates: { secteurs: 'ok' },
    });
    if (outcome.status === 'done') {
      expect(outcome.draft.actions[0].secteurs).toEqual({
        secteurs: ['tertiaire'],
        justification: 'Bâtiments publics.',
      });
    }
  });

  it('saute les secteurs par défaut', async () => {
    const outcome = await runImportPipeline(routedLlm(), input());

    expect(outcome).toMatchObject({ stepStates: { secteurs: 'skipped' } });
    if (outcome.status === 'done') {
      expect(outcome.draft.actions[0].secteurs).toBeUndefined();
    }
  });

  it("classe les secteurs pendant l'enrichissement, chaque appel compté à son étape", async () => {
    const llm = routedLlm();
    const route = vi.mocked(llm.generateStructured).getMockImplementation();
    let startSecteurs = () => undefined as void;
    const secteursStarted = new Promise<void>((resolve) => {
      startSecteurs = resolve;
    });
    vi.mocked(llm.generateStructured).mockImplementation((async (args: {
      prompt: string;
    }) => {
      const step = stepOf(args.prompt);
      if (step === 'secteurs') startSecteurs();
      // En série, l'enrichissement attendrait les secteurs sans fin.
      if (step === 'enrichment') await secteursStarted;
      currentLlmCallRecorder()?.calls.push({ model: step } as LlmCallEvent);
      return route?.(args as never);
    }) as never);
    const runs: ImportStepRun[] = [];

    const outcome = await runImportPipeline(
      llm,
      input({
        withSecteurs: true,
        onStepRun: async (run) => {
          runs.push(run);
        },
      })
    );

    expect(outcome).toMatchObject({
      status: 'done',
      stepStates: { enrichment: 'ok', secteurs: 'ok', qualitativeReview: 'ok' },
      draft: {
        qualitativeReview: 'Extraction cohérente',
        actions: [
          {
            secteurs: { secteurs: ['tertiaire'] },
            sousActions: [{ description: 'desc enrichie' }],
          },
        ],
      },
      tokens: { totalTokens: tokens.totalTokens * 6 },
    });
    expect(
      Object.fromEntries(
        runs.map(({ step, calls }) => [step, calls.map(({ model }) => model)])
      )
    ).toMatchObject({
      extraction: ['extraction'],
      scoring: ['scoring'],
      consolidation: ['consolidation'],
      enrichment: ['enrichment'],
      secteurs: ['secteurs'],
      qualitativeReview: ['qualitativeReview'],
    });
  });

  describe('reprise', () => {
    it.each([
      ['scoring', false],
      ['qualitativeReview', true],
    ] as const)(
      'après %s, un point de reprise découpé pour un autre modèle sert : %s',
      (completedStep, usable) => {
        const checkpoint = {
          schemaVersion: 1,
          completedStep,
          llm: { strategy: 'segmented', maxInputTokens: 100_000 },
        } as const;

        expect(isCheckpointUsableBy(checkpoint, routedLlm())).toBe(usable);
      }
    );

    const prompts = (llm: PipelineLlm): string[] =>
      vi
        .mocked(llm.generateStructured)
        .mock.calls.map(([args]) => (args as { prompt: string }).prompt);

    const segmentedLlm = (): PipelineLlm => {
      const llm = routedLlm();
      (llm as { capabilities: unknown }).capabilities = {
        ocr: false,
        strategy: 'segmented',
      };
      return llm;
    };

    const segmentedDocument = buildDocument('pdf', [
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

    const strategies = [
      { label: 'document entier', llm: routedLlm, document: undefined },
      {
        label: 'segmentée',
        llm: segmentedLlm,
        document: segmentedDocument,
      },
    ];

    it.each(strategies)(
      'enregistre un point de reprise JSON après chaque étape ($label)',
      async ({ llm, document }) => {
        const checkpoints: PipelineCheckpoint[] = [];

        await runImportPipeline(
          llm(),
          input({
            ...(document ? { document } : {}),
            withSecteurs: true,
            onCheckpoint: async (checkpoint) => {
              checkpoints.push(checkpoint);
            },
          })
        );

        // Les secteurs tournent à côté de l'enrichissement et de la revue : un
        // seul point de reprise après les deux branches.
        expect(checkpoints.map(({ completedStep }) => completedStep)).toEqual([
          'reading',
          'scouting',
          'extraction',
          'hierarchy',
          'scoring',
          'consolidation',
          'qualitativeReview',
        ]);
        for (const checkpoint of checkpoints) {
          expect(JSON.parse(JSON.stringify(checkpoint))).toEqual(checkpoint);
          expect(checkpoint.currentDate).toBe('2026-06-10');
        }
      }
    );

    it.each(strategies)(
      'reprend après chaque étape sans rappeler le modèle pour ce qui est fait ($label)',
      async ({ llm, document }) => {
        const checkpoints: PipelineCheckpoint[] = [];
        const referenceRuns: StepName[] = [];
        const firstLlm = llm();
        const reference = await runImportPipeline(
          firstLlm,
          input({
            ...(document ? { document } : {}),
            withSecteurs: true,
            onStepRun: async ({ step }) => {
              referenceRuns.push(step as StepName);
            },
            onCheckpoint: async (checkpoint) => {
              // Comme en base : un JSON, pas les objets de la pipeline.
              checkpoints.push(JSON.parse(JSON.stringify(checkpoint)));
            },
          })
        );
        const referencePrompts = prompts(firstLlm);
        expect(reference.status).toBe('done');

        for (const checkpoint of checkpoints) {
          const resumedLlm = llm();
          const runs: StepName[] = [];
          const { document: _document, ...base } = input({
            withSecteurs: true,
          });

          const resumed = await runImportPipeline(resumedLlm, {
            ...base,
            resumeFrom: checkpoint,
            onStepRun: async ({ step }) => {
              runs.push(step as StepName);
            },
          });

          const completed = stepOrder.indexOf(checkpoint.completedStep);
          const remaining = (step: StepName) =>
            stepOrder.indexOf(step) > completed;
          expect(resumed).toEqual(reference);
          // Mêmes prompts au caractère près : l'état restauré (unités gardées,
          // squelette, extraits) est bien celui du premier passage.
          expect(prompts(resumedLlm)).toEqual(
            referencePrompts.filter((prompt) => remaining(stepOf(prompt)))
          );
          expect(runs).toEqual(referenceRuns.filter(remaining));
        }
      }
    );

    const resumeInput = (
      resumeFrom: PipelineCheckpoint
    ): RunImportPipelineInput => {
      const { document: _document, ...base } = input({ withSecteurs: true });
      return { ...base, resumeFrom };
    };

    const runWithCheckpoints = async (
      llm: PipelineLlm,
      overrides: Partial<FreshInput>
    ) => {
      const checkpoints: PipelineCheckpoint[] = [];
      const outcome = await runImportPipeline(
        llm,
        input({
          ...overrides,
          onCheckpoint: async (checkpoint) => {
            checkpoints.push(JSON.parse(JSON.stringify(checkpoint)));
          },
        })
      );
      return { outcome, lastCheckpoint: checkpoints.at(-1) };
    };

    it("après une revue en échec, reprend sans refaire l'enrichissement ni les secteurs", async () => {
      const { outcome, lastCheckpoint } = await runWithCheckpoints(
        routedLlm('qualitativeReview'),
        { withSecteurs: true }
      );

      expect(outcome).toMatchObject({
        status: 'failed',
        failedStep: 'qualitativeReview',
        stepStates: {
          enrichment: 'ok',
          secteurs: 'ok',
          qualitativeReview: 'pending',
        },
      });
      expect(lastCheckpoint?.completedStep).toBe('secteurs');

      const resumedLlm = routedLlm();
      const resumed = await runImportPipeline(
        resumedLlm,
        resumeInput(lastCheckpoint as PipelineCheckpoint)
      );

      expect(prompts(resumedLlm).map(stepOf)).toEqual(['qualitativeReview']);
      expect(resumed).toEqual(
        await runImportPipeline(routedLlm(), input({ withSecteurs: true }))
      );
    });

    it("n'écrit pas de point de reprise au-delà d'un enrichissement en échec", async () => {
      const { outcome, lastCheckpoint } = await runWithCheckpoints(
        routedLlm('enrichment'),
        { withSecteurs: true }
      );

      expect(outcome).toMatchObject({
        status: 'failed',
        failedStep: 'enrichment',
        stepStates: {
          enrichment: 'pending',
          secteurs: 'ok',
          qualitativeReview: 'pending',
        },
      });
      if (outcome.status === 'failed') {
        expect(outcome.partialDraft.actions[0].secteurs).toBeDefined();
      }
      expect(lastCheckpoint?.completedStep).toBe('consolidation');
    });

    it("reprend un point de reprise d'avant la mise en parallèle, arrêté après l'enrichissement", async () => {
      // Sans secteurs, la revue en échec laisse l'état d'un ancien point de
      // reprise « enrichment » : il ne reste qu'à marquer les secteurs à faire.
      const { lastCheckpoint } = await runWithCheckpoints(
        routedLlm('qualitativeReview'),
        { withSecteurs: false }
      );
      const last = lastCheckpoint as PipelineCheckpoint;
      const afterEnrichment: PipelineCheckpoint = {
        ...last,
        completedStep: 'enrichment',
        progress: {
          ...last.progress,
          stepStates: { ...last.progress.stepStates, secteurs: 'pending' },
        },
      };

      const resumedLlm = routedLlm();
      const resumed = await runImportPipeline(
        resumedLlm,
        resumeInput(afterEnrichment)
      );

      expect(prompts(resumedLlm).map(stepOf).sort()).toEqual([
        'qualitativeReview',
        'secteurs',
      ]);
      expect(resumed).toEqual(
        await runImportPipeline(routedLlm(), input({ withSecteurs: true }))
      );
    });
  });
});
