import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { uniq } from 'es-toolkit';
import { Enjeu } from '@tet/domain/shared';
import { describe, expect, it, Mock, vi } from 'vitest';
import { z } from 'zod';
import { ClassifyFicheFailure } from '../classify-fiche/classify-fiche.errors';
import { ClassifyFicheService } from '../classify-fiche/classify-fiche.service';
import { EnjeuRepositories } from '../enjeu.repositories';
import {
  FicheAnalysis,
  ficheAnalysisSchema,
  FicheCandidate,
} from '../models/fiche-analysis';
import { MobilisationState } from '../models/mobilisation-state';
import { LevierMobilisation } from '../mobilisation.repository';
import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { FicheVolets } from '../volet.repository';
import { ClassifyFicheResult } from '../pipeline/classify-fiche/classify-fiche';
import { FicheToClassify } from '../pipeline/classify-fiche/render-fiche-text';
import { CalculateCollectiviteMobilisationError } from '../score-mobilisation/score-mobilisation.errors';
import { CalculateCollectiviteMobilisationInput } from '../score-mobilisation/score-mobilisation.input';
import {
  MobilisationScore,
  ScoreMobilisationService,
} from '../score-mobilisation/score-mobilisation.service';
import { AnalysisRunRepository } from './analysis-run.repository';
import {
  AnalyzeFichesInput,
  collectiviteSelectionSchema,
} from './analyze-fiches.input';
import { AnalyzeFichesService } from './analyze-fiches.service';
import { ANALYZED_COLLECTIVITE_IDS } from './analyzed-collectivite-ids';
import { AnalyzedCollectivites } from './analyzed-collectivites';
import { calculateFicheFingerprint } from './calculate-fiche-fingerprint.rules';
import {
  FicheAnalysisStatusRepository,
  FicheAnalysisUpsert,
} from './fiche-analysis-status.repository';
import { FicheAxePathError } from './analyze-fiches.errors';
import {
  AxePath,
  FicheAxePaths,
  FicheAxePathRepository,
} from './fiche-axe-path.repository';
import {
  FicheCandidateRepository,
  FicheCandidateSelection,
} from './fiche-candidate.repository';
import { FicheTextRepository } from './fiche-text.repository';

const PAST = new Date('2020-01-01T00:00:00.000Z');
const LAST_RUN_START = new Date('2026-09-28T02:00:00.000Z');
const RUN_START = new Date('2026-09-29T02:00:00.000Z');

const classificationTokens: TokenUsage = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

type StoredMobilisation = {
  readonly calculatedAt: Date;
  readonly ficheIds: readonly number[];
};

type ClassifyBehavior = (
  fiche: FicheToClassify,
  callIndex: number
) =>
  | Result<ClassifyFicheResult, ClassifyFicheFailure>
  | Promise<Result<ClassifyFicheResult, ClassifyFicheFailure>>;

type ScoreBehavior = (
  input: CalculateCollectiviteMobilisationInput,
  callIndex: number
) => Result<MobilisationScore, CalculateCollectiviteMobilisationError>;

type HarnessOptions = {
  readonly fiches?: readonly FicheCandidate[];
  readonly analyses?: readonly FicheAnalysis[];
  readonly mobilisations?: ReadonlyMap<number, StoredMobilisation>;
  readonly volets?: readonly FicheVolet[];
  readonly axePaths?: ReadonlyMap<number, readonly AxePath[]>;
  readonly axePathsFailure?: FicheAxePathError;
  readonly lastRunStart?: Date | null;
  readonly classify?: ClassifyBehavior;
  readonly score?: ScoreBehavior;
  readonly analyzedCollectivites?: AnalyzedCollectivites;
};

type Harness = {
  readonly service: AnalyzeFichesService;
  readonly events: string[];
  readonly selections: FicheCandidateSelection[];
  readonly classifiedFiches: FicheToClassify[];
  readonly classifyEnjeux: Enjeu[];
  readonly upserts: FicheAnalysisUpsert[];
  readonly scoreInputs: CalculateCollectiviteMobilisationInput[];
  readonly updatedMobilisations: {
    collectiviteId: number;
    leviers: LevierMobilisation[];
  }[];
  readonly createdRuns: Date[];
  readonly enjeuRepositories: {
    voletsOf: Mock;
    mobilisationOf: Mock;
  };
  readonly analysisOf: (ficheId: number) => FicheAnalysis | undefined;
  readonly getLastCompletedRunStart: Mock;
};

const toFiche = ({
  ficheId,
  collectiviteId,
  titre = `Fiche ${ficheId}`,
  modifiedAt = PAST,
  isDeleted = false,
}: {
  ficheId: number;
  collectiviteId: number;
  titre?: string;
  modifiedAt?: Date;
  isDeleted?: boolean;
}): FicheCandidate => ({
  ficheId,
  collectiviteId,
  titre,
  description: null,
  modifiedAt,
  isDeleted,
});

const toProcessedAnalysis = (
  fiche: FicheCandidate,
  analyzedAt: Date = PAST
): FicheAnalysis =>
  ficheAnalysisSchema.parse({
    ficheId: fiche.ficheId,
    collectiviteId: fiche.collectiviteId,
    status: 'processed',
    fingerprint: calculateFicheFingerprint(fiche),
    analyzedAt,
  });

const toFailedAnalysis = ({
  fiche,
  retryCount,
  fingerprintOf,
}: {
  fiche: FicheCandidate;
  retryCount: number;
  fingerprintOf: FicheCandidate;
}): FicheAnalysis =>
  ficheAnalysisSchema.parse({
    ficheId: fiche.ficheId,
    collectiviteId: fiche.collectiviteId,
    status: 'failed',
    fingerprint: calculateFicheFingerprint(fingerprintOf),
    retryCount,
    analyzedAt: PAST,
  });

const classifyEveryFiche: ClassifyBehavior = ({ ficheId }) =>
  success({
    fiche: {
      ficheId,
      isDescriptionTruncated: false,
      volets: [{ levier: 'Covoiturage', categorie: 'amenagement' }],
    },
    tokens: classificationTokens,
  });

const scoredLeviers: LevierMobilisation[] = [
  {
    levierId: 'covoiturage',
    volets: [{ categorie: 'amenagement', note: 2, ficheIds: [1] }],
  },
];

const scoreEveryCollectivite: ScoreBehavior = () =>
  success({ leviers: scoredLeviers });

const everyCollectiviteAnalyzed: AnalyzedCollectivites = { has: () => true };

const applyUpsert = (
  stored: FicheAnalysis | undefined,
  upsert: FicheAnalysisUpsert
): FicheAnalysis => {
  const analyzedAt = new Date();
  if (upsert.status === 'processed') {
    return ficheAnalysisSchema.parse({ ...upsert, analyzedAt });
  }
  const fingerprint = stored?.fingerprint;
  if (upsert.status === 'stale') {
    return ficheAnalysisSchema.parse({ ...upsert, fingerprint, analyzedAt });
  }
  const previousRetryCount =
    stored?.status === 'failed' ? stored.retryCount : 0;
  return ficheAnalysisSchema.parse({
    ...upsert,
    fingerprint,
    retryCount: previousRetryCount + 1,
    analyzedAt,
  });
};

const toHarness = (options: HarnessOptions = {}): Harness => {
  const fiches = options.fiches ?? [];
  const analyses = new Map(
    (options.analyses ?? []).map((analysis) => [analysis.ficheId, analysis])
  );
  const mobilisations = new Map(options.mobilisations ?? []);
  const volets = [...(options.volets ?? [])];
  const classify = options.classify ?? classifyEveryFiche;
  const score = options.score ?? scoreEveryCollectivite;
  const events: string[] = [];
  const selections: FicheCandidateSelection[] = [];
  const classifiedFiches: FicheToClassify[] = [];
  const classifyEnjeux: Enjeu[] = [];
  const upserts: FicheAnalysisUpsert[] = [];
  const scoreInputs: CalculateCollectiviteMobilisationInput[] = [];
  const updatedMobilisations: Harness['updatedMobilisations'] = [];
  const createdRuns: Date[] = [];

  const collectiviteOf = (ficheId: number): number | undefined =>
    fiches.find((fiche) => fiche.ficheId === ficheId)?.collectiviteId;

  const ficheCandidates = {
    listCollectivitesWithFicheCandidates: vi.fn(async () =>
      success(uniq(fiches.map(({ collectiviteId }) => collectiviteId)))
    ),
    listFicheCandidates: vi.fn(async (selection: FicheCandidateSelection) => {
      events.push(`list_fiches:${selection.collectiviteId}`);
      selections.push(selection);
      return success(
        fiches.filter(
          ({ collectiviteId }) => collectiviteId === selection.collectiviteId
        )
      );
    }),
  };
  const ficheTexts = {
    listFicheTexts: vi.fn(async ({ ficheIds }: { ficheIds: number[] }) =>
      success(
        fiches
          .filter(({ ficheId }) => ficheIds.includes(ficheId))
          .map(({ ficheId, titre, description }) => ({
            ficheId,
            titre,
            description,
          }))
      )
    ),
  };
  const ficheAxePaths = {
    listFicheAxePaths: vi.fn(
      async ({
        ficheIds,
      }: {
        ficheIds: number[];
      }): Promise<Result<FicheAxePaths[], FicheAxePathError>> => {
        if (options.axePathsFailure !== undefined) {
          return failure(options.axePathsFailure);
        }
        return success(
          ficheIds.map((ficheId) => ({
            ficheId,
            axePaths: options.axePaths?.get(ficheId) ?? [],
          }))
        );
      }
    ),
  };
  const ficheAnalyses = {
    listAnalyses: vi.fn(
      async ({ collectiviteId }: { collectiviteId: number }) =>
        success(
          [...analyses.values()].filter(
            (analysis) => analysis.collectiviteId === collectiviteId
          )
        )
    ),
    upsertAnalyses: vi.fn(
      async ({
        analyses: upsertedAnalyses,
      }: {
        analyses: FicheAnalysisUpsert[];
      }) => {
        upsertedAnalyses.forEach((upsert) => {
          events.push(`upsert_${upsert.status}:${upsert.ficheId}`);
          upserts.push(upsert);
          analyses.set(
            upsert.ficheId,
            applyUpsert(analyses.get(upsert.ficheId), upsert)
          );
        });
        return success(undefined);
      }
    ),
    deleteAnalyses: vi.fn(async ({ ficheIds }: { ficheIds: number[] }) => {
      ficheIds.forEach((ficheId) => {
        events.push(`delete_analysis:${ficheId}`);
        analyses.delete(ficheId);
      });
      return success(undefined);
    }),
  };
  const getLastCompletedRunStart = vi.fn(async () =>
    success(options.lastRunStart ?? null)
  );
  const analysisRuns = {
    getLastCompletedRunStart,
    createCompletedRun: vi.fn(async ({ startedAt }: { startedAt: Date }) => {
      createdRuns.push(startedAt);
      return success(undefined);
    }),
  };
  const voletRepository = {
    saveVolets: vi.fn(
      async ({ fiches: savedFiches }: { fiches: FicheVolets[] }) => {
        savedFiches.forEach(({ ficheId }) =>
          events.push(`save_volets:${ficheId}`)
        );
        return success(undefined);
      }
    ),
    listVolets: vi.fn(async ({ collectiviteId }: { collectiviteId: number }) =>
      success(
        volets.filter(
          ({ ficheId }) => collectiviteOf(ficheId) === collectiviteId
        )
      )
    ),
    deleteVolets: vi.fn(async ({ ficheIds }: { ficheIds: number[] }) => {
      ficheIds.forEach((ficheId) => events.push(`delete_volets:${ficheId}`));
      return success(undefined);
    }),
  };
  const mobilisationRepository = {
    listCollectivitesWithMobilisation: vi.fn(async () =>
      success([...mobilisations.keys()])
    ),
    getMobilisationState: vi.fn(
      async ({
        collectiviteId,
      }: {
        collectiviteId: number;
      }): Promise<Result<MobilisationState, never>> => {
        events.push(`get_mobilisation:${collectiviteId}`);
        const stored = mobilisations.get(collectiviteId);
        if (stored === undefined) {
          return success({ kind: 'never_calculated' });
        }
        return success({
          kind: 'calculated',
          calculatedAt: stored.calculatedAt,
          ficheIds: [...stored.ficheIds],
        });
      }
    ),
    updateMobilisation: vi.fn(
      async ({
        collectiviteId,
        leviers,
      }: {
        collectiviteId: number;
        leviers: LevierMobilisation[];
      }) => {
        events.push(`update_mobilisation:${collectiviteId}`);
        updatedMobilisations.push({ collectiviteId, leviers });
        mobilisations.set(collectiviteId, {
          calculatedAt: new Date(),
          ficheIds: [],
        });
        return success(undefined);
      }
    ),
  };
  const enjeuRepositories = {
    voletsOf: vi.fn(() => voletRepository),
    mobilisationOf: vi.fn(() => mobilisationRepository),
  };
  const classifyFicheService = {
    classify: vi.fn(
      async ({
        enjeu,
        fiche,
      }: {
        enjeu: Enjeu;
        fiche: FicheToClassify;
      }) => {
        events.push(`classify:${fiche.ficheId}`);
        classifyEnjeux.push(enjeu);
        classifiedFiches.push(fiche);
        return classify(fiche, classifiedFiches.length);
      }
    ),
  };
  const scoreMobilisationService = {
    calculateCollectiviteMobilisation: vi.fn(
      async (input: CalculateCollectiviteMobilisationInput) => {
        scoreInputs.push(input);
        return score(input, scoreInputs.length);
      }
    ),
  };

  const ficheCandidateDependency =
    ficheCandidates as unknown as FicheCandidateRepository;
  const ficheTextDependency = ficheTexts as unknown as FicheTextRepository;
  const ficheAxePathDependency =
    ficheAxePaths as unknown as FicheAxePathRepository;
  const ficheAnalysisDependency =
    ficheAnalyses as unknown as FicheAnalysisStatusRepository;
  const analysisRunDependency =
    analysisRuns as unknown as AnalysisRunRepository;
  const enjeuRepositoriesDependency =
    enjeuRepositories as unknown as EnjeuRepositories;
  const classifyFicheDependency =
    classifyFicheService as unknown as ClassifyFicheService;
  const scoreMobilisationDependency =
    scoreMobilisationService as unknown as ScoreMobilisationService;

  const service = new AnalyzeFichesService(
    ficheCandidateDependency,
    ficheTextDependency,
    ficheAxePathDependency,
    ficheAnalysisDependency,
    analysisRunDependency,
    enjeuRepositoriesDependency,
    classifyFicheDependency,
    scoreMobilisationDependency,
    options.analyzedCollectivites ?? everyCollectiviteAnalyzed
  );

  return {
    service,
    events,
    selections,
    classifiedFiches,
    classifyEnjeux,
    scoreInputs,
    updatedMobilisations,
    createdRuns,
    upserts,
    enjeuRepositories,
    analysisOf: (ficheId) => analyses.get(ficheId),
    getLastCompletedRunStart,
  };
};

type CollectiviteSelection = z.output<typeof collectiviteSelectionSchema>;

const onCollectivites = (
  collectivites: CollectiviteSelection
): AnalyzeFichesInput => ({
  enjeu: 'ges',
  scope: { kind: 'collectivites', collectivites },
  startedAt: RUN_START,
});

const dailyRun: AnalyzeFichesInput = {
  enjeu: 'ges',
  scope: { kind: 'daily' },
  startedAt: RUN_START,
};

const alwaysFailing: ClassifyBehavior = () =>
  failure({ kind: 'api_error', httpStatus: 503 });

const alwaysInvalid: ClassifyBehavior = () =>
  failure({ kind: 'invalid_json', rawTextLength: 12 });

describe('full-flow', () => {
  it('un lancement sur une liste de CT ne parcourt que ces CT', async () => {
    const harness = toHarness({
      fiches: [1, 2, 3].map((collectiviteId) =>
        toFiche({ ficheId: collectiviteId * 10, collectiviteId })
      ),
    });

    await harness.service.analyzeFiches(onCollectivites([1, 2]));

    expect(
      harness.selections.map(({ collectiviteId }) => collectiviteId)
    ).toEqual([1, 2]);
  });

  it('un lancement sur all parcourt toute CT de la liste retenue qui a une fiche candidate ou un engagement', async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 3810 }),
        toFiche({ ficheId: 20, collectiviteId: 3814 }),
      ],
      mobilisations: new Map([
        [3814, { calculatedAt: PAST, ficheIds: [20] }],
        [3815, { calculatedAt: PAST, ficheIds: [] }],
      ]),
      analyzedCollectivites: ANALYZED_COLLECTIVITE_IDS,
    });

    await harness.service.analyzeFiches(onCollectivites('all'));

    expect(
      harness.selections.map(({ collectiviteId }) => collectiviteId)
    ).toEqual([3810, 3814, 3815]);
  });

  it('un lancement sur all ignore une CT absente de la liste retenue, même avec une fiche candidate ou un engagement', async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 20, collectiviteId: 3810 }),
      ],
      mobilisations: new Map([[2, { calculatedAt: PAST, ficheIds: [] }]]),
      analyzedCollectivites: ANALYZED_COLLECTIVITE_IDS,
    });

    await harness.service.analyzeFiches(onCollectivites('all'));

    expect(
      harness.selections.map(({ collectiviteId }) => collectiviteId)
    ).toEqual([3810]);
  });

  it('un lancement sur une liste de CT parcourt une CT absente de la liste retenue', async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect(
      harness.selections.map(({ collectiviteId }) => collectiviteId)
    ).toEqual([1]);
  });

  it("termine les fiches, les statuts et l'engagement d'une CT avant de lire les fiches de la suivante", async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 20, collectiviteId: 2 }),
      ],
    });

    await harness.service.analyzeFiches(onCollectivites([1, 2]));

    const secondCollectiviteRead = harness.events.indexOf('list_fiches:2');
    expect({
      beforeSecondCollectivite: harness.events.slice(0, secondCollectiviteRead),
    }).toEqual({
      beforeSecondCollectivite: [
        'list_fiches:1',
        'classify:10',
        'save_volets:10',
        'upsert_processed:10',
        'get_mobilisation:1',
        'update_mobilisation:1',
      ],
    });
  });

  it('relit toutes les fiches des CT demandées sans tenir compte du dernier passage', async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
      lastRunStart: LAST_RUN_START,
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      lastRunRead: harness.getLastCompletedRunStart.mock.calls.length,
      selections: harness.selections,
    }).toEqual({
      lastRunRead: 0,
      selections: [{ kind: 'every_fiche', collectiviteId: 1 }],
    });
  });

  it('classe chaque fiche que le plan désigne par un appel qui ne porte qu’elle', async () => {
    const fiches = Array.from({ length: 30 }, (_, index) =>
      toFiche({ ficheId: index + 1, collectiviteId: 1 })
    );
    const harness = toHarness({ fiches });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect(harness.classifiedFiches.map(({ ficheId }) => ficheId)).toEqual(
      fiches.map(({ ficheId }) => ficheId)
    );
  });

  it('écrit les volets d’un groupe de 25 fiches avant de classer le groupe suivant', async () => {
    const fiches = Array.from({ length: 30 }, (_, index) =>
      toFiche({ ficheId: index + 1, collectiviteId: 1 })
    );
    const harness = toHarness({ fiches });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      lastOfFirstGroupSavedBeforeFirstOfSecondClassified:
        harness.events.indexOf('save_volets:25') <
        harness.events.indexOf('classify:26'),
      firstGroupClassifiedBeforeAnySave:
        harness.events.indexOf('classify:25') <
        harness.events.indexOf('save_volets:1'),
    }).toEqual({
      lastOfFirstGroupSavedBeforeFirstOfSecondClassified: true,
      firstGroupClassifiedBeforeAnySave: true,
    });
  });

  it('fournit à la classification le chemin des axes de chaque fiche', async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 11, collectiviteId: 1 }),
      ],
      axePaths: new Map([[10, [['PCAET', 'Mobilité']]]]),
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect(
      harness.classifiedFiches.map(({ ficheId, axePaths }) => ({
        ficheId,
        axePaths,
      }))
    ).toEqual([
      { ficheId: 10, axePaths: [['PCAET', 'Mobilité']] },
      { ficheId: 11, axePaths: [] },
    ]);
  });

  it("écrit les volets puis le statut traité et l'empreinte de chaque fiche classée", async () => {
    const fiche = toFiche({ ficheId: 10, collectiviteId: 1 });
    const harness = toHarness({ fiches: [fiche] });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      writes: harness.events.filter(
        (event) =>
          event.startsWith('save_volets') || event.startsWith('upsert_')
      ),
      analysis: harness.analysisOf(10),
    }).toEqual({
      writes: ['save_volets:10', 'upsert_processed:10'],
      analysis: expect.objectContaining({
        status: 'processed',
        fingerprint: calculateFicheFingerprint(fiche),
      }),
    });
  });
});

describe('concurrent-classification', () => {
  it('lance ensemble les appels des 25 fiches d’un groupe', async () => {
    const startedFicheIds: number[] = [];
    let openGate: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    const harness = toHarness({
      fiches: Array.from({ length: 25 }, (_, index) =>
        toFiche({ ficheId: index + 1, collectiviteId: 1 })
      ),
      classify: async (fiche, callIndex) => {
        startedFicheIds.push(fiche.ficheId);
        if (startedFicheIds.length === 25) {
          openGate();
        }
        await gate;
        return classifyEveryFiche(fiche, callIndex);
      },
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect(startedFicheIds).toHaveLength(25);
  });

  it('attribue chaque réponse à sa fiche quand les appels se terminent dans le désordre', async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 11, collectiviteId: 1 }),
      ],
      classify: async (fiche, callIndex) => {
        const delayInMs = fiche.ficheId === 10 ? 20 : 0;
        await new Promise((resolve) => setTimeout(resolve, delayInMs));
        return fiche.ficheId === 10
          ? failure({ kind: 'api_error', httpStatus: 400 })
          : classifyEveryFiche(fiche, callIndex);
      },
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect([
      harness.analysisOf(10)?.status,
      harness.analysisOf(11)?.status,
    ]).toEqual(['failed', 'processed']);
  });
});

describe('axe-paths-issue', () => {
  it('interrompt le passage sans classer aucune fiche quand le chemin des axes ne peut pas être lu', async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
      axePathsFailure: 'LIST_FICHE_AXE_PATHS_ERROR',
    });

    const analysisResult = await harness.service.analyzeFiches(
      onCollectivites([1])
    );

    expect({
      analysisResult,
      classifyCalls: harness.classifiedFiches.length,
    }).toEqual({
      analysisResult: {
        success: false,
        error: {
          kind: 'step_failed',
          step: 'list_fiche_axe_paths',
          cause: 'LIST_FICHE_AXE_PATHS_ERROR',
        },
      },
      classifyCalls: 0,
    });
  });
});

describe('enjeu', () => {
  it("classe les fiches, écrit les volets et calcule l'engagement pour l'enjeu reçu en entrée", async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      classifyEnjeux: uniq(harness.classifyEnjeux),
      voletsOf: uniq(harness.enjeuRepositories.voletsOf.mock.calls.flat()),
      mobilisationOf: uniq(
        harness.enjeuRepositories.mobilisationOf.mock.calls.flat()
      ),
      scoreEnjeux: uniq(harness.scoreInputs.map(({ enjeu }) => enjeu)),
    }).toEqual({
      classifyEnjeux: ['ges'],
      voletsOf: ['ges'],
      mobilisationOf: ['ges'],
      scoreEnjeux: ['ges'],
    });
  });
});

describe('fiche-sans-volet', () => {
  it('écrit un statut traité pour une fiche classée sans volet', async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
      classify: ({ ficheId }) =>
        success({
          fiche: { ficheId, isDescriptionTruncated: false, volets: [] },
          tokens: classificationTokens,
        }),
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect(harness.analysisOf(10)?.status).toEqual('processed');
  });
});

describe('daily-ct-check', () => {
  it('lit les fiches en attente depuis le début du dernier passage quotidien terminé', async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
      lastRunStart: LAST_RUN_START,
    });

    await harness.service.analyzeFiches(dailyRun);

    expect(harness.selections).toEqual([
      { kind: 'pending_since', collectiviteId: 1, since: LAST_RUN_START },
    ]);
  });

  it("lit toutes les fiches de chaque CT quand aucun passage quotidien n'a encore été enregistré", async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
      lastRunStart: null,
    });

    await harness.service.analyzeFiches(dailyRun);

    expect(harness.selections).toEqual([
      { kind: 'every_fiche', collectiviteId: 1 },
    ]);
  });

  it('parcourt toute CT qui a une fiche candidate ou un engagement, même sans fiche en attente', async () => {
    const fiche = toFiche({ ficheId: 10, collectiviteId: 1 });
    const harness = toHarness({
      fiches: [fiche],
      analyses: [toProcessedAnalysis(fiche)],
      mobilisations: new Map([[2, { calculatedAt: PAST, ficheIds: [] }]]),
      lastRunStart: LAST_RUN_START,
    });

    await harness.service.analyzeFiches(dailyRun);

    expect(
      harness.events.filter((event) => event.startsWith('get_mobilisation'))
    ).toEqual(['get_mobilisation:1', 'get_mobilisation:2']);
  });

  it('ignore une CT absente de la liste retenue, même avec une fiche candidate ou un engagement', async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 20, collectiviteId: 3810 }),
      ],
      mobilisations: new Map([[2, { calculatedAt: PAST, ficheIds: [] }]]),
      lastRunStart: LAST_RUN_START,
      analyzedCollectivites: ANALYZED_COLLECTIVITE_IDS,
    });

    await harness.service.analyzeFiches(dailyRun);

    expect(
      harness.selections.map(({ collectiviteId }) => collectiviteId)
    ).toEqual([3810]);
  });

  it("vérifie l'engagement des CT qui n'ont plus aucun statut", async () => {
    const harness = toHarness({
      mobilisations: new Map([[2, { calculatedAt: PAST, ficheIds: [99] }]]),
    });

    await harness.service.analyzeFiches(dailyRun);

    expect(
      harness.updatedMobilisations.map(({ collectiviteId }) => collectiviteId)
    ).toEqual([2]);
  });

  it("recalcule l'engagement des CT périmées avec les volets et le texte de leurs fiches classées", async () => {
    const fiche = toFiche({ ficheId: 10, collectiviteId: 1 });
    const volet: FicheVolet = {
      ficheId: 10,
      levierId: 'covoiturage',
      categorie: 'amenagement',
    };
    const harness = toHarness({
      fiches: [fiche],
      analyses: [toProcessedAnalysis(fiche, LAST_RUN_START)],
      mobilisations: new Map([[1, { calculatedAt: PAST, ficheIds: [10] }]]),
      volets: [volet],
    });

    await harness.service.analyzeFiches(dailyRun);

    expect(harness.scoreInputs).toEqual([
      {
        enjeu: 'ges',
        collectiviteId: 1,
        volets: [volet],
        fiches: [{ ficheId: 10, titre: 'Fiche 10', description: null }],
      },
    ]);
  });

  it("remplace l'engagement de la CT par celui que ScoreMobilisationService vient de calculer", async () => {
    const fiche = toFiche({ ficheId: 10, collectiviteId: 1 });
    const harness = toHarness({
      fiches: [fiche],
      analyses: [toProcessedAnalysis(fiche, LAST_RUN_START)],
      mobilisations: new Map([[1, { calculatedAt: PAST, ficheIds: [10] }]]),
    });

    await harness.service.analyzeFiches(dailyRun);

    expect(harness.updatedMobilisations).toEqual([
      { collectiviteId: 1, leviers: scoredLeviers },
    ]);
  });

  it("ne recalcule pas l'engagement d'une CT à jour", async () => {
    const fiche = toFiche({ ficheId: 10, collectiviteId: 1 });
    const harness = toHarness({
      fiches: [fiche],
      analyses: [toProcessedAnalysis(fiche, PAST)],
      mobilisations: new Map([
        [1, { calculatedAt: LAST_RUN_START, ficheIds: [10] }],
      ]),
      lastRunStart: LAST_RUN_START,
    });

    await harness.service.analyzeFiches(dailyRun);

    expect({
      scoreCalls: harness.scoreInputs.length,
      updates: harness.updatedMobilisations.length,
    }).toEqual({ scoreCalls: 0, updates: 0 });
  });

  it('enregistre le passage quotidien avec sa date de début', async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
    });

    await harness.service.analyzeFiches(dailyRun);

    expect(harness.createdRuns).toEqual([RUN_START]);
  });

  it("n'enregistre pas de passage quotidien pour un lancement sur des CT", async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
    });

    await harness.service.analyzeFiches(onCollectivites('all'));

    expect(harness.createdRuns).toEqual([]);
  });
});

describe('cron-action-management', () => {
  it('marque périmées, compteur à 0, les fiches désignées par le plan avant de les classer', async () => {
    const previousFiche = toFiche({ ficheId: 10, collectiviteId: 1 });
    const modifiedFiche = toFiche({
      ficheId: 10,
      collectiviteId: 1,
      titre: 'Titre modifié',
      modifiedAt: RUN_START,
    });
    const harness = toHarness({
      fiches: [modifiedFiche],
      analyses: [toProcessedAnalysis(previousFiche)],
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect(
      harness.events.filter(
        (event) => event.startsWith('upsert_') || event.startsWith('classify')
      )
    ).toEqual(['upsert_stale:10', 'classify:10', 'upsert_processed:10']);
  });
});

describe('retry-on-failure', () => {
  it("relance jusqu'à 3 fois dans le passage une fiche dont la réponse est invalide, puis la classe", async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
      classify: (fiche, callIndex) => {
        const isBeforeThirdAttempt = callIndex < 3;
        return isBeforeThirdAttempt
          ? failure({ kind: 'invalid_json', rawTextLength: 12 })
          : classifyEveryFiche(fiche, callIndex);
      },
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      calls: harness.classifiedFiches.map(({ ficheId }) => ficheId),
      status: harness.analysisOf(10)?.status,
    }).toEqual({ calls: [10, 10, 10], status: 'processed' });
  });

  it("ne relance que la fiche en échec, sans compter d'essai raté aux autres fiches du groupe", async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 11, collectiviteId: 1 }),
      ],
      classify: (fiche, callIndex) =>
        fiche.ficheId === 11
          ? failure({ kind: 'invalid_json', rawTextLength: 12 })
          : classifyEveryFiche(fiche, callIndex),
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      calls: harness.classifiedFiches.map(({ ficheId }) => ficheId).toSorted(),
      statuses: [
        harness.analysisOf(10)?.status,
        harness.analysisOf(11)?.status,
      ],
    }).toEqual({ calls: [10, 11, 11, 11], statuses: ['processed', 'failed'] });
  });

  it("ne relance pas une fiche en erreur d'API, que le fournisseur a déjà rejouée", async () => {
    const harness = toHarness({
      fiches: [toFiche({ ficheId: 10, collectiviteId: 1 })],
      classify: alwaysFailing,
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      calls: harness.classifiedFiches.length,
      status: harness.analysisOf(10)?.status,
    }).toEqual({ calls: 1, status: 'failed' });
  });

  it('écrit en erreur, compteur incrémenté et empreinte inchangée, une fiche qui échoue 3 fois', async () => {
    const classifiedVersion = toFiche({
      ficheId: 10,
      collectiviteId: 1,
      titre: 'Version classée',
    });
    const fiche = toFiche({ ficheId: 10, collectiviteId: 1 });
    const harness = toHarness({
      fiches: [fiche],
      analyses: [
        toFailedAnalysis({
          fiche,
          retryCount: 1,
          fingerprintOf: classifiedVersion,
        }),
      ],
      classify: alwaysInvalid,
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      classifyCalls: harness.classifiedFiches.length,
      upserts: harness.upserts,
    }).toEqual({
      classifyCalls: 3,
      upserts: [{ ficheId: 10, collectiviteId: 1, status: 'failed' }],
    });
  });

  it("relance jusqu'à 3 fois le calcul d'engagement d'une CT avant de la compter en échec", async () => {
    const harness = toHarness({
      mobilisations: new Map([[2, { calculatedAt: PAST, ficheIds: [99] }]]),
      score: () =>
        failure({ kind: 'collectivite_not_found', collectiviteId: 2 }),
    });

    const analysisResult = await harness.service.analyzeFiches(dailyRun);

    expect({
      scoreCalls: harness.scoreInputs.length,
      updates: harness.updatedMobilisations.length,
      analysisResult,
    }).toEqual({
      scoreCalls: 3,
      updates: 0,
      analysisResult: {
        success: true,
        data: {
          classifiedFicheIds: [],
          failedFicheIds: [],
          removedFicheIds: [],
          recalculatedCollectiviteIds: [],
          failedCollectiviteIds: [2],
        },
      },
    });
  });
});

describe('reclassification-on-deletion', () => {
  it('supprime les volets et le statut des fiches supprimées', async () => {
    const deletedFiche = toFiche({
      ficheId: 10,
      collectiviteId: 1,
      isDeleted: true,
    });
    const harness = toHarness({
      fiches: [deletedFiche],
      analyses: [toProcessedAnalysis(deletedFiche)],
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      deletions: harness.events.filter((event) => event.startsWith('delete_')),
      analysis: harness.analysisOf(10),
    }).toEqual({
      deletions: ['delete_volets:10', 'delete_analysis:10'],
      analysis: undefined,
    });
  });

  it('ne reclasse aucune autre fiche de la CT', async () => {
    const deletedFiche = toFiche({
      ficheId: 10,
      collectiviteId: 1,
      isDeleted: true,
    });
    const processedFiche = toFiche({ ficheId: 11, collectiviteId: 1 });
    const harness = toHarness({
      fiches: [deletedFiche, processedFiche],
      analyses: [
        toProcessedAnalysis(deletedFiche),
        toProcessedAnalysis(processedFiche),
      ],
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect(harness.classifiedFiches).toEqual([]);
  });
});

describe('full-flow-behavior-on-already-processed-action', () => {
  it("n'appelle pas le LLM pour une CT dont toutes les fiches sont traitées et inchangées", async () => {
    const fiche = toFiche({ ficheId: 10, collectiviteId: 1 });
    const harness = toHarness({
      fiches: [fiche],
      analyses: [toProcessedAnalysis(fiche, PAST)],
      mobilisations: new Map([
        [1, { calculatedAt: LAST_RUN_START, ficheIds: [10] }],
      ]),
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      classifyCalls: harness.classifiedFiches.length,
      scoreCalls: harness.scoreInputs.length,
    }).toEqual({ classifyCalls: 0, scoreCalls: 0 });
  });
});

describe('llm-issue', () => {
  const toFailingRun = (): Harness =>
    toHarness({
      fiches: [
        ...[11, 12, 13, 14, 15].map((ficheId) =>
          toFiche({ ficheId, collectiviteId: 1 })
        ),
        ...[21, 22, 23, 24].map((ficheId) =>
          toFiche({ ficheId, collectiviteId: 2 })
        ),
        toFiche({ ficheId: 31, collectiviteId: 3 }),
      ],
      mobilisations: new Map([[1, { calculatedAt: PAST, ficheIds: [99] }]]),
      classify: alwaysFailing,
      score: () =>
        failure({ kind: 'collectivite_not_found', collectiviteId: 1 }),
    });

  it('abandonne le passage au 10e échec définitif, fiches et CT confondues, même réparti sur plusieurs CT, en rapportant la CT et la cause de chaque échec', async () => {
    const harness = toFailingRun();

    const analysisResult = await harness.service.analyzeFiches(dailyRun);

    const apiError = { kind: 'api_error', httpStatus: 503 };
    expect(analysisResult).toEqual({
      success: false,
      error: {
        kind: 'failure_threshold_reached',
        failures: [
          ...[11, 12, 13, 14, 15].map((ficheId) => ({
            kind: 'fiche',
            ficheId,
            collectiviteId: 1,
            cause: apiError,
          })),
          {
            kind: 'mobilisation',
            collectiviteId: 1,
            cause: { kind: 'collectivite_not_found', collectiviteId: 1 },
          },
          ...[21, 22, 23, 24].map((ficheId) => ({
            kind: 'fiche',
            ficheId,
            collectiviteId: 2,
            cause: apiError,
          })),
        ],
      },
    });
  });

  it('ne traite aucune CT après un abandon', async () => {
    const harness = toFailingRun();

    await harness.service.analyzeFiches(dailyRun);

    expect(
      harness.selections.map(({ collectiviteId }) => collectiviteId)
    ).toEqual([1, 2]);
  });

  it("n'enregistre pas un passage abandonné", async () => {
    const harness = toFailingRun();

    await harness.service.analyzeFiches(dailyRun);

    expect(harness.createdRuns).toEqual([]);
  });

  it("garde les statuts déjà écrits avant l'abandon", async () => {
    const harness = toFailingRun();

    await harness.service.analyzeFiches(dailyRun);

    expect(
      [11, 15, 21, 24].map((ficheId) => harness.analysisOf(ficheId)?.status)
    ).toEqual(['failed', 'failed', 'failed', 'failed']);
  });
});
