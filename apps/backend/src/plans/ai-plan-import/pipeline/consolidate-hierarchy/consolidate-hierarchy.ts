import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { Result, success } from '@tet/backend/utils/result.type';
import { chunk } from 'es-toolkit';
import { ExtractedAction } from '../../models/extracted-action';
import { PlanSkeleton, renderSkeleton } from '../../models/plan-skeleton';
import { HIERARCHIE_PROMPT } from '../../prompts/hierarchie.prompt';
import {
  applyHierarchy,
  HierarchyEntry,
  HierarchyOutcome,
  hierarchyResponseSchema,
} from './apply-hierarchy';

// Chaque lot reçoit le squelette entier : les doublons ne sont vus qu'au sein
// d'un lot, ce que le fenêtrage à la jonction des extraits rend suffisant.
export const HIERARCHY_BATCH_SIZE = 50;
export const HIERARCHY_CONCURRENCY = 3;
// Environ 40 tokens par action rendue ; le reste pour le raisonnement, que
// gpt-oss prend sur ce budget sans le déclarer.
const HIERARCHY_MAX_OUTPUT_TOKENS = 16_000;
// En dessous, un lot qui échoue encore est laissé tel qu'extrait.
const MIN_SPLIT_BATCH_SIZE = 5;

export type ConsolidateHierarchyResult = HierarchyOutcome & {
  tokens: TokenUsage;
  /** Lots laissés tels qu'extraits, pour le rapport. */
  warnings: string[];
};

type IndexedAction = { action: ExtractedAction; index: number };

type BatchOutcome = {
  entries: HierarchyEntry[];
  tokens: TokenUsage[];
  warnings: string[];
};

/**
 * Rattache chaque action au squelette et fusionne les doublons, sans relire
 * le texte. C'est une amélioration, pas une condition : un lot que le modèle
 * ne sait pas traiter garde les rattachements de l'extraction.
 */
export const consolidateHierarchy = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    actions,
    skeleton,
    signal,
  }: {
    actions: ExtractedAction[];
    skeleton: PlanSkeleton;
    signal?: AbortSignal;
  }
): Promise<Result<ConsolidateHierarchyResult, LlmError>> => {
  const indexed = actions.map((action, index) => ({ action, index }));
  const squelette = renderSkeleton(skeleton);
  const outcomes = await mapWithConcurrency(
    chunk(indexed, HIERARCHY_BATCH_SIZE),
    HIERARCHY_CONCURRENCY,
    (batch) => consolidateBatch(llm, { batch, squelette, signal })
  );
  return success({
    ...applyHierarchy(
      actions,
      outcomes.flatMap(({ entries }) => entries)
    ),
    tokens: sumTokenUsage(outcomes.flatMap(({ tokens }) => tokens)),
    warnings: outcomes.flatMap(({ warnings }) => warnings),
  });
};

/** Un lot tronqué ou mal formé est coupé en deux : la réponse tient mieux. */
const consolidateBatch = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    batch,
    squelette,
    signal,
  }: { batch: IndexedAction[]; squelette: string; signal?: AbortSignal }
): Promise<BatchOutcome> => {
  const completion = await llm.generateStructured({
    tier: 'strong',
    prompt: generatePrompt(HIERARCHIE_PROMPT, {
      squelette,
      actions: batch
        .map(({ action, index }) => renderLine(action, index))
        .join('\n'),
    }),
    schema: hierarchyResponseSchema,
    maxOutputTokens: HIERARCHY_MAX_OUTPUT_TOKENS,
    // Recopier des libellés du squelette ne demande pas de réfléchir.
    reasoningEffort: 'low',
    signal,
  });
  if (completion.success) {
    const requested = new Set(batch.map(({ index }) => index));
    return {
      entries: completion.data.data.filter((entry) =>
        requested.has(entry.index)
      ),
      tokens: [completion.data.tokens],
      warnings: [],
    };
  }
  const { kind } = completion.error;
  if (
    (kind === 'truncated' || kind === 'invalid_json') &&
    batch.length > MIN_SPLIT_BATCH_SIZE
  ) {
    const middle = Math.ceil(batch.length / 2);
    const halves = await Promise.all(
      [batch.slice(0, middle), batch.slice(middle)].map((half) =>
        consolidateBatch(llm, { batch: half, squelette, signal })
      )
    );
    return {
      entries: halves.flatMap(({ entries }) => entries),
      tokens: halves.flatMap(({ tokens }) => tokens),
      warnings: halves.flatMap(({ warnings }) => warnings),
    };
  }
  const first = batch[0].index + 1;
  const last = batch[batch.length - 1].index + 1;
  return {
    entries: [],
    tokens: [],
    warnings: [
      `Mise en cohérence non faite pour les actions ${first} à ${last} : ${kind}`,
    ],
  };
};

const renderLine = (action: ExtractedAction, index: number): string =>
  `|${index}| ${action.axe || '(sans axe)'} > ${
    action.sousAxe || '(sans sous-axe)'
  } > ${action.titre}`;
