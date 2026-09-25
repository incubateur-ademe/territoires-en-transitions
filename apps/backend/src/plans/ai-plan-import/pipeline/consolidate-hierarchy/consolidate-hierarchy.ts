import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import {
  combineResults,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { chunk } from 'es-toolkit';
import { ExtractedAction } from '../../models/extracted-action';
import { PlanSkeleton, renderSkeleton } from '../../models/plan-skeleton';
import { HIERARCHIE_PROMPT } from '../../prompts/hierarchie.prompt';
import {
  applyHierarchy,
  HierarchyOutcome,
  hierarchyResponseSchema,
} from './apply-hierarchy';

// Chaque lot reçoit le squelette entier : les doublons ne sont vus qu'au sein
// d'un lot, ce que le fenêtrage à la jonction des extraits rend suffisant.
export const HIERARCHY_BATCH_SIZE = 150;
export const HIERARCHY_CONCURRENCY = 3;
const HIERARCHY_MAX_OUTPUT_TOKENS = 12_000;

export type ConsolidateHierarchyResult = HierarchyOutcome & {
  tokens: TokenUsage;
};

/** Rattache chaque action au squelette et fusionne les doublons, sans relire le texte. */
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
    async (batch) => {
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
        signal,
      });
      if (!completion.success) {
        return completion;
      }
      const requested = new Set(batch.map(({ index }) => index));
      return success({
        entries: completion.data.data.filter((entry) =>
          requested.has(entry.index)
        ),
        tokens: completion.data.tokens,
      });
    }
  );
  const combined = combineResults(outcomes);
  if (!combined.success) {
    return combined;
  }
  return success({
    ...applyHierarchy(
      actions,
      combined.data.flatMap(({ entries }) => entries)
    ),
    tokens: sumTokenUsage(combined.data.map(({ tokens }) => tokens)),
  });
};

const renderLine = (action: ExtractedAction, index: number): string =>
  `|${index}| ${action.axe || '(sans axe)'} > ${
    action.sousAxe || '(sans sous-axe)'
  } > ${action.titre}`;
