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
import { z } from 'zod';
import { REPERAGE_PROMPT } from '../../prompts/reperage.prompt';
import { DocumentUnit } from '../segment-document/document-unit';

export const unitCategoryValues = [
  'fiche_action',
  'structure',
  'diagnostic',
  'engagement_partenaire',
  'autre',
] as const;

export type UnitCategory = (typeof unitCategoryValues)[number];

export const classifyUnitsResponseSchema = z.array(
  z.object({ index: z.number().int(), type: z.enum(unitCategoryValues) })
);

export const CLASSIFY_BATCH_SIZE = 40;
export const CLASSIFY_CONCURRENCY = 3;
// Le début d'un extrait suffit à dire ce qu'il est.
const PREVIEW_CHARS = 600;
const CLASSIFY_MAX_OUTPUT_TOKENS = 4_000;

export type ClassifyUnitsResult = {
  /** Catégorie par index d'unité ; une unité oubliée par le modèle n'y est pas. */
  categories: Map<number, UnitCategory>;
  tokens: TokenUsage;
};

/** Trie les unités par lots, avec le palier léger : c'est un tri, pas une lecture. */
export const classifyUnits = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { units, signal }: { units: DocumentUnit[]; signal?: AbortSignal }
): Promise<Result<ClassifyUnitsResult, LlmError>> => {
  const indexed = units.map((unit, index) => ({ unit, index }));
  const outcomes = await mapWithConcurrency(
    chunk(indexed, CLASSIFY_BATCH_SIZE),
    CLASSIFY_CONCURRENCY,
    async (batch) => {
      const completion = await llm.generateStructured({
        tier: 'light',
        prompt: generatePrompt(REPERAGE_PROMPT, {
          extraits: batch
            .map(({ unit, index }) => renderPreview(unit, index))
            .join('\n'),
        }),
        schema: classifyUnitsResponseSchema,
        maxOutputTokens: CLASSIFY_MAX_OUTPUT_TOKENS,
        reasoningEffort: 'low',
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
    categories: new Map(
      combined.data.flatMap(({ entries }) =>
        entries.map((entry) => [entry.index, entry.type] as const)
      )
    ),
    tokens: sumTokenUsage(combined.data.map(({ tokens }) => tokens)),
  });
};

const renderPreview = (unit: DocumentUnit, index: number): string => {
  const preview = unit.text.replace(/\s+/g, ' ').slice(0, PREVIEW_CHARS);
  const place = [
    ...(unit.section ? [`partie « ${unit.section} »`] : []),
    ...unit.headingPath,
  ].join(' > ');
  return `#${index} | pages ${unit.pageStart + 1}–${unit.pageEnd + 1} | ${
    place || '-'
  } | ${preview}`;
};
