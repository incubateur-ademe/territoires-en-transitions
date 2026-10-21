import { currentLlmCallRecorder } from '@tet/backend/utils/llm/llm-call-recorder';
import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import type { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { axisPathOf, ExtractedAction } from '../models/extracted-action';
import { ImportStepRun } from '../models/import-step-run';
import {
  buildDocument,
  buildPage,
  type ReadDocument,
} from './document/document-page';
import { SPREADSHEET_RULE } from '../prompts/field-rules';
import {
  buildHorizontalHierarchyWorkbook,
  buildMixedWorkbook,
  buildTestWorkbook,
  FLAT_TABLE_ROWS,
} from './__fixtures__/build-test-workbook';
import type { PipelineCheckpoint } from './pipeline-checkpoint';
import { readDocument } from './read-document/read-document';
import {
  isCheckpointUsableBy,
  MAX_DOCUMENT_UNITS,
  PipelineLlm,
  RunImportPipelineInput,
  runImportPipeline,
  StepName,
  StepStates,
  stepStatesSchema,
} from './run-import-pipeline';

const stepOrder = stepStatesSchema.keyof().options;

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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

const readWorkbookDocument = async (
  buffer: Promise<Buffer>
): Promise<ReadDocument> => {
  const read = await readDocument({
    buffer: await buffer,
    mimeType: XLSX_MIME,
  });
  if (!read.success) {
    throw new Error(read.error.kind);
  }
  return read.data;
};

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

  it('ne cite aux secteurs aucune sous-action quand withSousActions est faux', async () => {
    const llm = routedLlm();

    await runImportPipeline(
      llm,
      input({ withSousActions: false, withSecteurs: true })
    );

    const secteursPrompts = vi
      .mocked(llm.generateStructured)
      .mock.calls.map(([args]) => (args as { prompt: string }).prompt)
      .filter((prompt) => stepOf(prompt) === 'secteurs');
    expect(secteursPrompts).toHaveLength(1);
    expect(secteursPrompts[0]).not.toContain('Sous action A');
  });

  it("retire en lecture entière le sous-axe qui ne porte que l'action du même titre", async () => {
    const [extracted] = responseByStep.extraction as object[];
    const llm = {
      maxInputTokens: 900_000,
      capabilities: { ocr: false, strategy: 'whole-document' },
      generateStructured: vi.fn(async ({ prompt }: { prompt: string }) => {
        const step = stepOf(prompt);
        return success({
          data:
            step === 'extraction'
              ? [
                  {
                    ...extracted,
                    'sous-axe': '1.1 Rénover les écoles',
                    titre: 'Rénover les écoles',
                  },
                ]
              : responseByStep[step],
          tokens,
        });
      }),
    } as unknown as PipelineLlm;

    const outcome = await runImportPipeline(
      llm,
      input({ withVerifications: false, withSousActions: false })
    );

    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.stepStates.hierarchy).toBe('skipped');
      expect(outcome.draft.actions[0].sousAxe).toBe('');
    }
  });

  it("garde deux lignes de même titre d'un tableur, y compris à la reprise", async () => {
    const [extracted] = responseByStep.extraction as object[];
    const row = { ...extracted, description: '', 'sous-actions': [] };
    const llm = routedLlm();
    const route = vi.mocked(llm.generateStructured).getMockImplementation();
    vi.mocked(llm.generateStructured).mockImplementation((async (args: {
      prompt: string;
    }) =>
      stepOf(args.prompt) === 'extraction'
        ? success({
            data: [
              { ...row, axe: 'Axe 1' },
              { ...row, axe: 'Axe 2' },
            ],
            tokens,
          })
        : route?.(args as never)) as never);
    const options = { withVerifications: false, withSousActions: false };
    const checkpoints: PipelineCheckpoint[] = [];

    const outcome = await runImportPipeline(
      llm,
      input({
        ...options,
        document: buildDocument('csv', [
          buildPage(0, [{ text: 'Titre;Axe' }, { text: '1.1.1 Action;Axe 1' }]),
        ]),
        onCheckpoint: async (checkpoint) => {
          checkpoints.push(JSON.parse(JSON.stringify(checkpoint)));
        },
      })
    );

    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.draft.actions.map(({ axe }) => axe)).toEqual([
        'Axe 1',
        'Axe 2',
      ]);
    }
    expect(checkpoints[0]).toMatchObject({
      completedStep: 'reading',
      documentKind: 'csv',
    });
    const { document: _document, ...base } = input(options);
    expect(
      await runImportPipeline(llm, { ...base, resumeFrom: checkpoints[0] })
    ).toEqual(outcome);
  });

  it("fond les titres repris d'un onglet confié au modèle aux fiches fusionnées sur plusieurs rangées, y compris à la reprise", async () => {
    // Deux fiches seulement : trop peu pour que le code lise l'onglet.
    const document = await readWorkbookDocument(
      buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            ['Axe', 'Fiche', 'Sous-action'],
            ['Axe 1', 'Isoler les écoles', 'Diagnostiquer les bâtiments'],
            [null, null, 'Isoler les combles'],
            ['Axe 2', 'Rénover la mairie', 'Choisir le maître d’œuvre'],
            [null, null, 'Réaliser les travaux'],
          ],
          merges: ['A2:A3', 'B2:B3', 'A4:A5', 'B4:B5'],
        },
      ])
    );
    const [extracted] = responseByStep.extraction as object[];
    const row = { ...extracted, description: '', 'sous-actions': [] };
    const llm = routedLlm();
    const route = vi.mocked(llm.generateStructured).getMockImplementation();
    vi.mocked(llm.generateStructured).mockImplementation((async (args: {
      prompt: string;
    }) =>
      stepOf(args.prompt) === 'extraction'
        ? success({
            data: [
              { ...row, axe: 'Axe 1' },
              { ...row, axe: 'Axe 2' },
            ],
            tokens,
          })
        : route?.(args as never)) as never);
    const options = { withVerifications: false, withSousActions: false };
    const checkpoints: PipelineCheckpoint[] = [];

    const outcome = await runImportPipeline(
      llm,
      input({
        ...options,
        document,
        onCheckpoint: async (checkpoint) => {
          checkpoints.push(JSON.parse(JSON.stringify(checkpoint)));
        },
      })
    );

    expect(outcome.status).toBe('done');
    if (outcome.status === 'done') {
      expect(outcome.draft.actions).toHaveLength(1);
    }
    expect(checkpoints[0]).toMatchObject({
      documentKind: 'xlsx',
      tabularRowGroups: true,
    });
    expect(checkpoints[0]).not.toHaveProperty('workbook');
    expect(JSON.stringify(checkpoints[0])).not.toContain('isMergeSlave');
    const [{ prompt }] = vi.mocked(llm.generateStructured).mock.calls[0];
    expect(prompt).toContain(SPREADSHEET_RULE);
    expect(prompt).toContain('[Onglet « Plan »]');
    const { document: _document, ...base } = input(options);
    expect(
      await runImportPipeline(llm, { ...base, resumeFrom: checkpoints[0] })
    ).toEqual(outcome);
  });

  it("n'ajoute pas la règle des tableurs au prompt d'un PDF", async () => {
    const llm = routedLlm();

    await runImportPipeline(
      llm,
      input({ withVerifications: false, withSousActions: false })
    );

    const [{ prompt }] = vi.mocked(llm.generateStructured).mock.calls[0];
    expect(prompt).not.toContain(SPREADSHEET_RULE);
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
    "va au bout quand l'étape %s échoue sur une erreur qu'une reprise ne corrigerait pas",
    async (failingStep) => {
      const runs: ImportStepRun[] = [];

      const outcome = await runImportPipeline(
        routedLlm(failingStep, { kind: 'api_error', httpStatus: 400 }),
        input({
          onStepRun: async (run) => {
            runs.push(run);
          },
        })
      );

      expect(outcome).toMatchObject({
        status: 'done',
        stepStates: { [failingStep]: 'ok' },
        warnings: [expect.stringContaining('api_error 400')],
      });
      expect(runs.find(({ step }) => step === failingStep)).toMatchObject({
        status: 'ok',
        details: { failedBatches: 1 },
      });
    }
  );

  it.each([
    ['enrichment', 500],
    ['qualitativeReview', null],
  ] as const)(
    "échoue, pour être repris, quand tous les lots de l'étape %s échouent sur une panne (%s)",
    async (failingStep, httpStatus) => {
      const outcome = await runImportPipeline(
        routedLlm(failingStep, { kind: 'api_error', httpStatus }),
        input()
      );

      expect(outcome).toMatchObject({
        status: 'failed',
        failedStep: failingStep,
        error: { kind: 'api_error', httpStatus },
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
        // point de reprise chaque fois que la suite des étapes faites s'allonge.
        expect(checkpoints.map(({ completedStep }) => completedStep)).toEqual([
          'reading',
          'scouting',
          'extraction',
          'hierarchy',
          'scoring',
          'consolidation',
          'enrichment',
          'secteurs',
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
          // squelette, extraits) est bien celui du premier passage. Les
          // branches parallèles ne gardent pas leur ordre d'une fois à l'autre.
          expect(prompts(resumedLlm).sort()).toEqual(
            referencePrompts
              .filter((prompt) => remaining(stepOf(prompt)))
              .sort()
          );
          expect(runs.sort()).toEqual(referenceRuns.filter(remaining).sort());
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

    // L'étape en suspens ne répond qu'à son annulation, comme un appel en vol :
    // par une erreur, ou en levant comme l'attente d'une relance.
    const llmWithPendingStep = (
      failingStep: StepName,
      pendingStep: StepName,
      onAbort: 'fail' | 'throw'
    ): PipelineLlm => {
      const llm = routedLlm(failingStep);
      const route = vi.mocked(llm.generateStructured).getMockImplementation();
      let startPending = () => undefined as void;
      const pendingStarted = new Promise<void>((resolve) => {
        startPending = resolve;
      });
      vi.mocked(llm.generateStructured).mockImplementation((async (args: {
        prompt: string;
        signal?: AbortSignal;
      }) => {
        const step = stepOf(args.prompt);
        if (step === pendingStep) {
          startPending();
          return new Promise((resolve, reject) => {
            args.signal?.addEventListener('abort', () =>
              onAbort === 'throw'
                ? reject(args.signal?.reason)
                : resolve(failure({ kind: 'api_error', httpStatus: null }))
            );
          });
        }
        if (step === failingStep) await pendingStarted;
        return route?.(args as never);
      }) as never);
      return llm;
    };

    it("arrête les secteurs quand l'enrichissement échoue, sans point de reprise au-delà", async () => {
      const llm = llmWithPendingStep('enrichment', 'secteurs', 'fail');

      const { outcome, lastCheckpoint } = await runWithCheckpoints(llm, {
        withSecteurs: true,
      });

      expect(outcome).toMatchObject({
        status: 'failed',
        failedStep: 'enrichment',
        error: { kind: 'rate_limited' },
        stepStates: {
          enrichment: 'pending',
          secteurs: 'pending',
          qualitativeReview: 'pending',
        },
      });
      expect(prompts(llm).map(stepOf)).not.toContain('qualitativeReview');
      expect(lastCheckpoint?.completedStep).toBe('consolidation');
    });

    it("arrête les secteurs quand la revue échoue, et garde l'enrichissement pour la reprise", async () => {
      const llm = llmWithPendingStep('qualitativeReview', 'secteurs', 'throw');

      const { outcome, lastCheckpoint } = await runWithCheckpoints(llm, {
        withSecteurs: true,
      });

      expect(outcome).toMatchObject({
        status: 'failed',
        failedStep: 'qualitativeReview',
        error: { kind: 'rate_limited' },
        stepStates: {
          enrichment: 'ok',
          secteurs: 'pending',
          qualitativeReview: 'pending',
        },
      });
      expect(lastCheckpoint?.completedStep).toBe('enrichment');
    });

    it.each([
      ['enrichment', 'secteurs'],
      ['secteurs', 'enrichment'],
    ] as const)(
      "arrête l'autre branche quand la progression de %s ne s'enregistre pas",
      async (reportedStep, pendingStep) => {
        const llm = routedLlm();
        const route = vi.mocked(llm.generateStructured).getMockImplementation();
        let startPending = () => undefined as void;
        const pendingStarted = new Promise<void>((resolve) => {
          startPending = resolve;
        });
        vi.mocked(llm.generateStructured).mockImplementation((async (args: {
          prompt: string;
          signal?: AbortSignal;
        }) => {
          const step = stepOf(args.prompt);
          if (step === pendingStep) {
            startPending();
            return new Promise((resolve) => {
              args.signal?.addEventListener('abort', () =>
                resolve(failure({ kind: 'api_error', httpStatus: null }))
              );
            });
          }
          if (step === reportedStep) await pendingStarted;
          return route?.(args as never);
        }) as never);
        const reportError = new Error('progression non enregistrée');

        const outcome = runImportPipeline(
          llm,
          input({
            withSecteurs: true,
            onStepStatesChange: async (stepStates) => {
              if (stepStates[reportedStep] !== 'pending') throw reportError;
            },
          })
        );

        await expect(outcome).rejects.toBe(reportError);
        expect(prompts(llm).map(stepOf)).not.toContain('qualitativeReview');
      }
    );

    it("écrit un point de reprise pendant les branches, sans ce que l'autre a fait au-delà", async () => {
      const llm = routedLlm();
      const route = vi.mocked(llm.generateStructured).getMockImplementation();
      const release: Partial<Record<StepName, () => void>> = {};
      const held = (step: StepName) =>
        new Promise<void>((resolve) => {
          release[step] = resolve;
        });
      const gates: Partial<Record<StepName, Promise<void>>> = {
        secteurs: held('secteurs'),
        qualitativeReview: held('qualitativeReview'),
      };
      vi.mocked(llm.generateStructured).mockImplementation((async (args: {
        prompt: string;
      }) => {
        await gates[stepOf(args.prompt)];
        return route?.(args as never);
      }) as never);
      const checkpoints: PipelineCheckpoint[] = [];
      const reports: StepStates[] = [];
      const last = () => checkpoints.at(-1) as PipelineCheckpoint;

      const outcome = runImportPipeline(
        llm,
        input({
          withSecteurs: true,
          onCheckpoint: async (checkpoint) => {
            checkpoints.push(JSON.parse(JSON.stringify(checkpoint)));
          },
          onStepStatesChange: async (stepStates) => {
            reports.push(stepStates);
          },
        })
      );

      await vi.waitFor(() => expect(last().completedStep).toBe('enrichment'));
      const afterEnrichment = last();
      expect(afterEnrichment.progress).toMatchObject({
        review: null,
        stepStates: {
          enrichment: 'ok',
          secteurs: 'pending',
          qualitativeReview: 'pending',
        },
        actions: [{ sousActions: [{ description: 'desc enrichie' }] }],
      });
      expect(afterEnrichment.progress.actions[0].secteurs).toBeUndefined();

      // La revue faite, les secteurs encore en cours : rien de plus à écrire.
      release.qualitativeReview?.();
      await vi.waitFor(() =>
        expect(reports.at(-1)?.qualitativeReview).toBe('ok')
      );
      expect(last()).toEqual(afterEnrichment);

      release.secteurs?.();
      expect(await outcome).toMatchObject({ status: 'done' });
      expect(last().completedStep).toBe('qualitativeReview');

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

    it("n'écrit un point de reprise qu'une fois le précédent enregistré", async () => {
      const llm = routedLlm();
      const route = vi.mocked(llm.generateStructured).getMockImplementation();
      let startSecteurs = () => undefined as void;
      const secteursMayStart = new Promise<void>((resolve) => {
        startSecteurs = resolve;
      });
      let secteursAnswered = () => undefined as void;
      const secteursDone = new Promise<void>((resolve) => {
        secteursAnswered = resolve;
      });
      vi.mocked(llm.generateStructured).mockImplementation((async (args: {
        prompt: string;
      }) => {
        if (stepOf(args.prompt) !== 'secteurs') return route?.(args as never);
        await secteursMayStart;
        const answer = await route?.(args as never);
        secteursAnswered();
        return answer;
      }) as never);
      const saved: StepName[] = [];

      await runImportPipeline(
        llm,
        input({
          withSecteurs: true,
          onCheckpoint: async ({ completedStep }) => {
            if (completedStep === 'enrichment') {
              // Les secteurs finissent pendant que ce point de reprise s'écrit.
              startSecteurs();
              await secteursDone;
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
            saved.push(completedStep);
          },
        })
      );

      expect(saved.slice(-3)).toEqual([
        'enrichment',
        'secteurs',
        'qualitativeReview',
      ]);
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

  describe('tableur lu par le code', () => {
    const strategies = ['whole-document', 'segmented'] as const;

    /** Le modèle ne lit plus le classeur : tout appel de lecture fait lever. */
    const tabularLlm = (
      strategy: (typeof strategies)[number],
      readingSteps: StepName[] = []
    ): PipelineLlm => {
      const llm = routedLlm();
      (llm as { capabilities: unknown }).capabilities = {
        ocr: false,
        strategy,
      };
      const route = vi.mocked(llm.generateStructured).getMockImplementation();
      vi.mocked(llm.generateStructured).mockImplementation((async (args: {
        prompt: string;
      }) => {
        const step = stepOf(args.prompt);
        if (
          !['secteurs', 'qualitativeReview', ...readingSteps].includes(step)
        ) {
          throw new Error(`Appel inattendu au modèle : ${step}`);
        }
        return route?.(args as never);
      }) as never);
      return llm;
    };

    const stepsCalled = (llm: PipelineLlm): StepName[] =>
      vi
        .mocked(llm.generateStructured)
        .mock.calls.map(([args]) =>
          stepOf((args as { prompt: string }).prompt)
        );

    const treeOf = (actions: ExtractedAction[]): string[] =>
      actions.map((action) =>
        [...axisPathOf(action), action.titre].join(' > ')
      );

    const tabularInput = async (
      overrides: Partial<FreshInput> = {}
    ): Promise<FreshInput> =>
      input({
        document: await readWorkbookDocument(
          buildHorizontalHierarchyWorkbook()
        ),
        withSecteurs: true,
        ...overrides,
      });

    it.each(strategies)(
      "construit l'arbre sans appeler le modèle hors secteurs et revue (%s)",
      async (strategy) => {
        const llm = tabularLlm(strategy);
        const runs: ImportStepRun[] = [];

        const outcome = await runImportPipeline(
          llm,
          await tabularInput({
            instructions: 'Ignorer les actions terminées',
            onStepRun: async (run) => {
              runs.push(run);
            },
          })
        );

        expect(stepsCalled(llm).sort()).toEqual([
          'qualitativeReview',
          'secteurs',
        ]);
        expect(outcome.status).toBe('done');
        if (outcome.status !== 'done') return;
        expect(treeOf(outcome.draft.actions)).toEqual([
          "AMBITION n°1 : Pour un territoire sobre en énergie > Se déplacer moins et mieux > Développer l'usage des transports collectifs > 1 - Aménager deux pôles multimodaux",
          "AMBITION n°1 : Pour un territoire sobre en énergie > Se déplacer moins et mieux > Développer l'usage des transports collectifs > 2 - Communiquer sur les aides à la mobilité",
          'AMBITION n°1 : Pour un territoire sobre en énergie > Se déplacer moins et mieux > Favoriser le covoiturage > 3 - Déployer des aires de covoiturage',
          "AMBITION n°1 : Pour un territoire sobre en énergie > Développer l'économie circulaire > Limiter l'usage des ressources > 4 - Faire monter en compétence les acteurs (EIT)",
          "AMBITION n°1 : Pour un territoire sobre en énergie > Développer l'économie circulaire > Accompagner les acteurs économiques > 5 - Faire monter en compétence les acteurs (EIT)",
          'AMBITION n°2 Pour un territoire préservé > Maîtriser la ressource en eau > 6 - Réduire les fuites des réseaux',
        ]);
        const [first] = outcome.draft.actions;
        expect(first.sousActions.map(({ statut }) => statut)).toEqual([
          'En cours',
          'À venir',
          'Réalisé',
        ]);
        expect(first.sousActions[0].description).toBeNull();
        expect(first.confidence).toBeNull();
        expect(first.secteurs).toBeDefined();
        expect(outcome.stepStates).toEqual({
          reading: 'ok',
          scouting: 'skipped',
          extraction: 'ok',
          hierarchy: 'skipped',
          scoring: 'skipped',
          consolidation: 'skipped',
          enrichment: 'skipped',
          secteurs: 'ok',
          qualitativeReview: 'ok',
        });
        expect(outcome.warnings).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/« Synthèse » ignoré/),
            "Les consignes et les vérifications ne s'appliquent pas aux 6 fiches lues sans le modèle (« Suivi »).",
          ])
        );
        expect(runs.find(({ step }) => step === 'reading')?.details).toEqual({
          ...(strategy === 'segmented' ? { units: 0 } : { chunks: 0 }),
          planSheets: 1,
          complementSheets: 1,
          ignoredSheets: 2,
          tabularActions: 6,
        });
      }
    );

    it.each(strategies)(
      'refuse sans appel au modèle un tableur dont le code lit trop de fiches (%s)',
      async (strategy) => {
        const llm = tabularLlm(strategy);
        const rows = Array.from(
          { length: MAX_DOCUMENT_UNITS + 1 },
          (_, index) => [
            index < 150 ? 'Mobilité' : 'Habitat',
            `Action n°${index + 1} du plan climat du territoire`,
            'Interco',
            'En cours',
          ]
        );

        const outcome = await runImportPipeline(
          llm,
          input({
            document: await readWorkbookDocument(
              buildTestWorkbook([
                {
                  name: 'Plan',
                  rows: [['Axe', 'Action', 'Porteur', 'Statut'], ...rows],
                },
              ])
            ),
          })
        );

        expect(outcome).toMatchObject({
          status: 'failed',
          failedStep: 'reading',
          error: {
            kind: 'document_too_long',
            chunks: MAX_DOCUMENT_UNITS + 1,
            maxChunks: MAX_DOCUMENT_UNITS,
          },
        });
        expect(llm.generateStructured).not.toHaveBeenCalled();
      }
    );

    it.each(strategies)(
      'reprend après la lecture sans relire le classeur ni doubler les actions (%s)',
      async (strategy) => {
        const checkpoints: PipelineCheckpoint[] = [];
        const outcome = await runImportPipeline(
          tabularLlm(strategy),
          await tabularInput({
            onCheckpoint: async (checkpoint) => {
              checkpoints.push(JSON.parse(JSON.stringify(checkpoint)));
            },
          })
        );
        expect(checkpoints[0]).toMatchObject({ completedStep: 'reading' });
        expect(checkpoints[0].progress.actions).toHaveLength(6);
        expect(checkpoints[0]).not.toHaveProperty('workbook');

        const { document: _document, ...base } = await tabularInput();
        for (const checkpoint of checkpoints.slice(0, 3)) {
          const resumed = await runImportPipeline(tabularLlm(strategy), {
            ...base,
            resumeFrom: checkpoint,
          });
          expect(resumed).toEqual(outcome);
        }
      }
    );

    it.each(strategies)(
      "ne confie au modèle que l'onglet qu'il n'a pas su lire (%s)",
      async (strategy) => {
        const llm = tabularLlm(strategy, [
          'scouting',
          'extraction',
          'hierarchy',
          'scoring',
          'consolidation',
          'enrichment',
        ]);
        const checkpoints: PipelineCheckpoint[] = [];

        const outcome = await runImportPipeline(
          llm,
          input({
            document: await readWorkbookDocument(buildMixedWorkbook()),
            onCheckpoint: async (checkpoint) => {
              checkpoints.push(JSON.parse(JSON.stringify(checkpoint)));
            },
          })
        );

        const readingPrompts = vi
          .mocked(llm.generateStructured)
          .mock.calls.map(([args]) => (args as { prompt: string }).prompt)
          .filter((prompt) =>
            ['scouting', 'extraction'].includes(stepOf(prompt))
          );
        expect(readingPrompts.length).toBeGreaterThan(0);
        for (const prompt of readingPrompts) {
          expect(prompt).not.toContain(FLAT_TABLE_ROWS[1][1]);
        }
        expect(
          readingPrompts.some((prompt) =>
            prompt.includes('Compte rendu du comité')
          )
        ).toBe(true);

        expect(outcome.status).toBe('done');
        if (outcome.status !== 'done') return;
        const titres = outcome.draft.actions.map(({ titre }) => titre);
        expect(titres).toHaveLength(6);
        expect(titres.slice(0, 5)).toEqual(
          FLAT_TABLE_ROWS.slice(1).map((row) => row[1])
        );
        // L'action du modèle garde sa tranche, après celles du code.
        const { source } = checkpoints.find(
          ({ completedStep }) => completedStep === 'extraction'
        ) as PipelineCheckpoint;
        expect(source.chunkIndexByAction).toHaveLength(6);
        expect(source.chunks[source.chunkIndexByAction[5]]).toContain(
          'Compte rendu du comité'
        );
        expect(source.chunks[source.chunkIndexByAction[0]]).toContain(
          FLAT_TABLE_ROWS[1][1]
        );
      }
    );

    it('applique les champs désactivés aux fiches lues par le code', async () => {
      const outcome = await runImportPipeline(
        tabularLlm('whole-document'),
        await tabularInput({ disabledFields: ['budget', 'statut'] })
      );

      expect(outcome.status).toBe('done');
      if (outcome.status !== 'done') return;
      const { actions } = outcome.draft;
      expect(actions.every(({ budget }) => budget === null)).toBe(true);
      expect(
        actions.every(
          ({ statut, sousActions }) =>
            statut === null &&
            sousActions.every((sousAction) => sousAction.statut === null)
        )
      ).toBe(true);
    });

    it("échoue sans action quand aucun onglet n'en porte", async () => {
      const outcome = await runImportPipeline(
        tabularLlm('whole-document'),
        input({
          document: await readWorkbookDocument(
            buildTestWorkbook([
              {
                name: 'Feuil2',
                rows: [['Statut'], ['En cours'], ['Terminée']],
                state: 'hidden',
              },
            ])
          ),
        })
      );

      expect(outcome).toMatchObject({
        status: 'failed',
        failedStep: 'extraction',
        error: { kind: 'no_actions_extracted' },
      });
    });
  });
});
