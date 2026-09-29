import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { uniq } from 'es-toolkit';
import { Enjeu } from '@tet/domain/shared';
import { describe, expect, it, Mock, vi } from 'vitest';
import { z } from 'zod';
import { ClassifyBatchFailure } from '../classify-batch/classify-batch.errors';
import {
  ClassifyBatchOutcome,
  ClassifyBatchService,
} from '../classify-batch/classify-batch.service';
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
import { FicheToClassify } from '../pipeline/classify-fiches/render-fiches-text';
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
import { calculateFicheFingerprint } from './calculate-fiche-fingerprint.rules';
import {
  FicheAnalysisStatusRepository,
  FicheAnalysisUpsert,
} from './fiche-analysis-status.repository';
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
  fiches: readonly FicheToClassify[],
  callIndex: number
) => Result<ClassifyBatchOutcome, ClassifyBatchFailure>;

type ScoreBehavior = (
  input: CalculateCollectiviteMobilisationInput,
  callIndex: number
) => Result<MobilisationScore, CalculateCollectiviteMobilisationError>;

type HarnessOptions = {
  readonly fiches?: readonly FicheCandidate[];
  readonly analyses?: readonly FicheAnalysis[];
  readonly mobilisations?: ReadonlyMap<number, StoredMobilisation>;
  readonly volets?: readonly FicheVolet[];
  readonly lastRunStart?: Date | null;
  readonly classify?: ClassifyBehavior;
  readonly score?: ScoreBehavior;
};

type Harness = {
  readonly service: AnalyzeFichesService;
  readonly events: string[];
  readonly selections: FicheCandidateSelection[];
  readonly classifiedBatches: number[][];
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

const classifyEveryFiche: ClassifyBehavior = (fiches) =>
  success({
    classified: fiches.map(({ ficheId }) => ({
      ficheId,
      justification: 'Covoiturage',
      isDescriptionTruncated: false,
      volets: [{ levier: 'Covoiturage', categorie: 'amenagement' }],
    })),
    sources: [...fiches],
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
  const classifiedBatches: number[][] = [];
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
  const classifyBatchService = {
    classify: vi.fn(
      async ({
        enjeu,
        fiches: batch,
      }: {
        enjeu: Enjeu;
        fiches: FicheToClassify[];
      }) => {
        events.push(
          `classify:${batch.map(({ ficheId }) => ficheId).join(',')}`
        );
        classifyEnjeux.push(enjeu);
        classifiedBatches.push(batch.map(({ ficheId }) => ficheId));
        return classify(batch, classifiedBatches.length);
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
  const ficheAnalysisDependency =
    ficheAnalyses as unknown as FicheAnalysisStatusRepository;
  const analysisRunDependency =
    analysisRuns as unknown as AnalysisRunRepository;
  const enjeuRepositoriesDependency =
    enjeuRepositories as unknown as EnjeuRepositories;
  const classifyBatchDependency =
    classifyBatchService as unknown as ClassifyBatchService;
  const scoreMobilisationDependency =
    scoreMobilisationService as unknown as ScoreMobilisationService;

  const service = new AnalyzeFichesService(
    ficheCandidateDependency,
    ficheTextDependency,
    ficheAnalysisDependency,
    analysisRunDependency,
    enjeuRepositoriesDependency,
    classifyBatchDependency,
    scoreMobilisationDependency
  );

  return {
    service,
    events,
    selections,
    classifiedBatches,
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

  it('un lancement sur all parcourt toute CT qui a une fiche candidate ou un engagement', async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 20, collectiviteId: 2 }),
      ],
      mobilisations: new Map([
        [2, { calculatedAt: PAST, ficheIds: [20] }],
        [3, { calculatedAt: PAST, ficheIds: [] }],
      ]),
    });

    await harness.service.analyzeFiches(onCollectivites('all'));

    expect(
      harness.selections.map(({ collectiviteId }) => collectiviteId)
    ).toEqual([1, 2, 3]);
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

  it('classe par lots de 25 les fiches que le plan désigne', async () => {
    const fiches = Array.from({ length: 30 }, (_, index) =>
      toFiche({ ficheId: index + 1, collectiviteId: 1 })
    );
    const harness = toHarness({ fiches });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect(harness.classifiedBatches.map((batch) => batch.length)).toEqual([
      25, 5,
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
      classify: (fiches) =>
        success({
          classified: fiches.map(({ ficheId }) => ({
            ficheId,
            justification: 'Aucun levier',
            isDescriptionTruncated: false,
            volets: [],
          })),
          sources: [...fiches],
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
  it("relance jusqu'à 3 fois dans le passage les seules fiches encore en échec", async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 11, collectiviteId: 1 }),
      ],
      classify: (fiches, callIndex) => {
        const isBeforeThirdAttempt = callIndex < 3;
        return isBeforeThirdAttempt
          ? failure({ kind: 'missing_indexes', indexes: [1] })
          : classifyEveryFiche(fiches, callIndex);
      },
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      batches: harness.classifiedBatches,
      statuses: [
        harness.analysisOf(10)?.status,
        harness.analysisOf(11)?.status,
      ],
    }).toEqual({
      batches: [
        [10, 11],
        [10, 11],
        [10, 11],
      ],
      statuses: ['processed', 'processed'],
    });
  });

  it("relance sans leur compter d'essai raté les autres fiches d'un lot dont une fiche est fautive", async () => {
    const harness = toHarness({
      fiches: [
        toFiche({ ficheId: 10, collectiviteId: 1 }),
        toFiche({ ficheId: 11, collectiviteId: 1 }),
      ],
      classify: (fiches, callIndex) =>
        fiches.some(({ ficheId }) => ficheId === 11)
          ? failure({ kind: 'duplicate_index', index: 1 })
          : classifyEveryFiche(fiches, callIndex),
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      batches: harness.classifiedBatches,
      statuses: [
        harness.analysisOf(10)?.status,
        harness.analysisOf(11)?.status,
      ],
    }).toEqual({
      batches: [[10, 11], [10, 11], [10, 11], [10]],
      statuses: ['processed', 'failed'],
    });
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
      classify: alwaysFailing,
    });

    await harness.service.analyzeFiches(onCollectivites([1]));

    expect({
      classifyCalls: harness.classifiedBatches.length,
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

    expect(harness.classifiedBatches).toEqual([]);
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
      classifyCalls: harness.classifiedBatches.length,
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

  it('abandonne le passage au 10e échec définitif, fiches et CT confondues, même réparti sur plusieurs CT', async () => {
    const harness = toFailingRun();

    const analysisResult = await harness.service.analyzeFiches(dailyRun);

    expect(analysisResult).toEqual({
      success: false,
      error: {
        kind: 'failure_threshold_reached',
        failures: [
          ...[11, 12, 13, 14, 15].map((ficheId) => ({
            kind: 'fiche',
            ficheId,
          })),
          { kind: 'mobilisation', collectiviteId: 1 },
          ...[21, 22, 23, 24].map((ficheId) => ({ kind: 'fiche', ficheId })),
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
