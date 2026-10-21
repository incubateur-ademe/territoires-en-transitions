import { SecteursProposes } from '@tet/backend/plans/fiches/fiche-secteurs/secteurs-proposes';
import { describeLlmError, LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import {
  emptyTokenUsage,
  sumTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { Result, success } from '@tet/backend/utils/result.type';
import { EffetAttendu } from '@tet/domain/shared';
import { uniq } from 'es-toolkit';
import { ExtractedAction } from '../../models/extracted-action';
import { renderActionsText } from '../score-actions/render-actions-text';
import {
  ChunkGroup,
  groupByChunk,
  SourceChunks,
} from '../source-chunks/source-chunks';
import { buildSecteursPrompt } from './classify-secteurs.prompt';
import {
  effetsAttendusResponseSchema,
  secteursResponseSchema,
} from './classify-secteurs.schema';

const SECTEURS_CONCURRENCY = 5;
/** Assez d'actions pour amortir la source, assez peu pour une réponse sûre. */
const SECTEURS_BATCH_SIZE = 30;

export type ClassifySecteursInput = {
  actions: ExtractedAction[];
  source: SourceChunks;
  /** Secteurs réglementaires demandés : plans PCAET. */
  withSecteurs: boolean;
  /** La liste close où choisir les effets attendus, lue en base. */
  effetsAttendus: EffetAttendu[];
  signal?: AbortSignal;
};

export type ClassifySecteursResult = {
  actions: ExtractedAction[];
  tokens: TokenUsage;
  warnings: string[];
  details: Record<string, number>;
};

type IndexedAction = { index: number; action: ExtractedAction };

type ClassifiedEntry = {
  index: number;
  /** Absent hors PCAET. */
  secteurs?: SecteursProposes;
  effetsAttendus: number[];
};

type BatchOutcome = {
  entries: ClassifiedEntry[];
  tokens: TokenUsage;
  warning: string | null;
};

/**
 * Secteurs réglementaires (PCAET) et effets attendus de chaque action, lus
 * avec la tranche du document qui la décrit, en un seul appel par lot. Un lot
 * en échec n'arrête pas l'import, même quand tous échouent : ses actions
 * restent sans proposition, et la complétion par Communs s'occupera des
 * secteurs.
 */
export const classifySecteurs = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    actions,
    source,
    withSecteurs,
    effetsAttendus,
    signal,
  }: ClassifySecteursInput
): Promise<Result<ClassifySecteursResult, LlmError>> => {
  const batches = groupByChunk(
    actions.map((action, index) => ({ index, action })),
    ({ index }) => index,
    source
  ).flatMap((group) => splitGroup(group, SECTEURS_BATCH_SIZE));

  const knownEffets = new Set(effetsAttendus.map(({ id }) => id));
  const subject = withSecteurs
    ? 'Secteurs et effets attendus'
    : 'Effets attendus';
  const outcomes = await mapWithConcurrency(
    batches,
    SECTEURS_CONCURRENCY,
    (batch) =>
      classifyBatch(llm, {
        batch,
        withSecteurs,
        effetsAttendus,
        subject,
        signal,
      })
  );

  const entriesByIndex = new Map(
    outcomes
      .flatMap((outcome) => outcome.entries)
      .map((entry) => [entry.index, entry])
  );
  let unknownEffets = 0;
  const classified = actions.map((action, index) => {
    const entry = entriesByIndex.get(index);
    if (!entry) {
      return action;
    }
    const proposed = uniq(entry.effetsAttendus);
    const known = proposed.filter((id) => knownEffets.has(id));
    unknownEffets += proposed.length - known.length;
    return {
      ...action,
      ...(entry.secteurs && { secteurs: entry.secteurs }),
      effetsAttendus: known,
    };
  });

  const warnings = outcomes.flatMap((outcome) =>
    outcome.warning ? [outcome.warning] : []
  );
  if (
    withSecteurs &&
    batches.length > 0 &&
    warnings.length === batches.length
  ) {
    warnings.push(
      `Aucun secteur proposé : les ${batches.length} lot(s) ont échoué, la complétion par Communs prendra le relais`
    );
  }

  const entries = [...entriesByIndex.values()];
  return success({
    actions: classified,
    tokens: sumTokenUsage(outcomes.map((outcome) => outcome.tokens)),
    warnings,
    details: {
      batches: batches.length,
      classified: entriesByIndex.size,
      ...(withSecteurs && {
        withoutSecteur: entries.filter(
          (entry) => entry.secteurs?.secteurs.length === 0
        ).length,
      }),
      withoutEffetAttendu: classified.filter(
        (action, index) =>
          entriesByIndex.has(index) && action.effetsAttendus?.length === 0
      ).length,
      unknownEffetsAttendus: unknownEffets,
    },
  });
};

const splitGroup = (
  group: ChunkGroup<IndexedAction>,
  size: number
): ChunkGroup<IndexedAction>[] =>
  Array.from({ length: Math.ceil(group.items.length / size) }, (_, i) => ({
    text: group.text,
    items: group.items.slice(i * size, (i + 1) * size),
  }));

const classifyBatch = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    batch,
    withSecteurs,
    effetsAttendus,
    subject,
    signal,
  }: {
    batch: ChunkGroup<IndexedAction>;
    withSecteurs: boolean;
    effetsAttendus: EffetAttendu[];
    subject: string;
    signal?: AbortSignal;
  }
): Promise<BatchOutcome> => {
  const request = {
    prompt: buildSecteursPrompt({
      renderedActions: renderActionsText(
        batch.items.map(({ action }) => action)
      ),
      text: batch.text,
      withSecteurs,
      effetsAttendus,
    }),
    tier: 'light' as const,
    thinkingLevel: 'low' as const,
    signal,
  };
  const completion = withSecteurs
    ? await llm.generateStructured({
        ...request,
        schema: secteursResponseSchema,
      })
    : await llm.generateStructured({
        ...request,
        schema: effetsAttendusResponseSchema,
      });
  if (!completion.success) {
    return {
      entries: [],
      tokens: emptyTokenUsage(),
      warning: `${subject} non proposés pour ${
        batch.items.length
      } action(s) : ${describeLlmError(completion.error)}`,
    };
  }

  // Le prompt numérote les actions du lot à partir de 0.
  const entries = completion.data.data.flatMap((entry): ClassifiedEntry[] => {
    const item = batch.items[entry.index];
    if (!item) {
      return [];
    }
    return [
      {
        index: item.index,
        effetsAttendus: entry.effetsAttendus,
        ...(withSecteurs &&
          'secteurs' in entry && {
            secteurs: {
              secteurs: uniq(entry.secteurs),
              justification: entry.justification.trim(),
            },
          }),
      },
    ];
  });
  return { entries, tokens: completion.data.tokens, warning: null };
};
