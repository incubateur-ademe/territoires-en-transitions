import { describeLlmError, LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import {
  emptyTokenUsage,
  sumTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { Result, success } from '@tet/backend/utils/result.type';
import { uniq } from 'es-toolkit';
import { ExtractedAction } from '../../models/extracted-action';
import { SECTEURS_PROMPT } from '../../prompts/secteurs.prompt';
import { renderActionsText } from '../score-actions/render-actions-text';
import {
  ChunkGroup,
  groupByChunk,
  SourceChunks,
} from '../source-chunks/source-chunks';
import {
  SecteursEntry,
  secteursResponseSchema,
} from './classify-secteurs.schema';

const SECTEURS_CONCURRENCY = 5;
/** Assez d'actions pour amortir la source, assez peu pour une réponse sûre. */
const SECTEURS_BATCH_SIZE = 30;

export type ClassifySecteursInput = {
  actions: ExtractedAction[];
  source: SourceChunks;
  signal?: AbortSignal;
};

export type ClassifySecteursResult = {
  actions: ExtractedAction[];
  tokens: TokenUsage;
  warnings: string[];
  details: Record<string, number>;
};

type IndexedAction = { index: number; action: ExtractedAction };

type BatchOutcome = {
  entries: SecteursEntry[];
  tokens: TokenUsage;
  warning: string | null;
};

/**
 * Secteurs réglementaires de chaque action, lus avec la tranche du document
 * qui la décrit. Un lot en échec n'arrête pas l'import : ses actions restent
 * sans secteur proposé, et la complétion par Communs s'en chargera.
 */
export const classifySecteurs = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { actions, source, signal }: ClassifySecteursInput
): Promise<Result<ClassifySecteursResult, LlmError>> => {
  const batches = groupByChunk(
    actions.map((action, index) => ({ index, action })),
    ({ index }) => index,
    source
  ).flatMap((group) => splitGroup(group, SECTEURS_BATCH_SIZE));

  const outcomes = await mapWithConcurrency(
    batches,
    SECTEURS_CONCURRENCY,
    (batch) => classifyBatch(llm, { batch, signal })
  );

  const secteursByIndex = new Map(
    outcomes
      .flatMap((outcome) => outcome.entries)
      .map((entry) => [entry.index, entry])
  );
  const classified = actions.map((action, index) => {
    const entry = secteursByIndex.get(index);
    return entry
      ? {
          ...action,
          secteurs: {
            secteurs: uniq(entry.secteurs),
            justification: entry.justification.trim(),
          },
        }
      : action;
  });

  return success({
    actions: classified,
    tokens: sumTokenUsage(outcomes.map((outcome) => outcome.tokens)),
    warnings: outcomes.flatMap((outcome) =>
      outcome.warning ? [outcome.warning] : []
    ),
    details: {
      batches: batches.length,
      classified: secteursByIndex.size,
      withoutSecteur: [...secteursByIndex.values()].filter(
        (entry) => entry.secteurs.length === 0
      ).length,
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
  { batch, signal }: { batch: ChunkGroup<IndexedAction>; signal?: AbortSignal }
): Promise<BatchOutcome> => {
  const completion = await llm.generateStructured({
    prompt: generatePrompt(SECTEURS_PROMPT, {
      actions: renderActionsText(batch.items.map(({ action }) => action)),
      texteSource: batch.text,
    }),
    tier: 'light',
    schema: secteursResponseSchema,
    signal,
  });
  if (!completion.success) {
    return {
      entries: [],
      tokens: emptyTokenUsage(),
      warning: `Secteurs non proposés pour ${
        batch.items.length
      } action(s) : ${describeLlmError(completion.error)}`,
    };
  }

  // Le prompt numérote les actions du lot à partir de 0.
  const entries = completion.data.data.flatMap((entry) => {
    const item = batch.items[entry.index];
    return item ? [{ ...entry, index: item.index }] : [];
  });
  return { entries, tokens: completion.data.tokens, warning: null };
};
