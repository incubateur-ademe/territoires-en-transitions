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

type ClassifyEntry = z.output<typeof classifyUnitsResponseSchema>[number];

export const CLASSIFY_BATCH_SIZE = 40;
export const CLASSIFY_CONCURRENCY = 3;
// Le début d'un extrait suffit à dire ce qu'il est.
const PREVIEW_CHARS = 600;
const CLASSIFY_MAX_OUTPUT_TOKENS = 4_000;

export type ClassifyUnitsResult = {
  /** Catégorie par index d'unité ; une unité oubliée par le modèle n'y est pas. */
  categories: Map<number, UnitCategory>;
  tokens: TokenUsage;
  /** Lots que le modèle n'a pas su trier : leurs unités sont toutes lues. */
  warnings: string[];
};

type IndexedUnit = { unit: DocumentUnit; index: number };

/**
 * Trie les unités par lots, avec le palier léger : c'est un tri, pas une
 * lecture. Un lot que le modèle ne sait pas trier, même à la seconde
 * tentative, n'écarte rien : ses unités sont lues comme sans tri.
 */
export const classifyUnits = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { units, signal }: { units: DocumentUnit[]; signal?: AbortSignal }
): Promise<Result<ClassifyUnitsResult, LlmError>> => {
  const indexed = units.map((unit, index) => ({ unit, index }));
  const outcomes = await mapWithConcurrency(
    chunk(indexed, CLASSIFY_BATCH_SIZE),
    CLASSIFY_CONCURRENCY,
    async (batch) => {
      let result = await classifyBatch(llm, batch, signal);
      if (!result.success && isTransientForTri(result.error)) {
        result = await classifyBatch(llm, batch, signal);
      }
      return result.success
        ? { ...result.data, warning: null }
        : {
            entries: [],
            tokens: emptyTokenUsage(),
            warning: `Tri non fait pour les extraits ${batch[0].index + 1} à ${
              batch[batch.length - 1].index + 1
            } : ${describeLlmError(result.error)}`,
          };
    }
  );
  return success({
    categories: new Map(
      outcomes.flatMap(({ entries }) =>
        entries.map((entry) => [entry.index, entry.type] as const)
      )
    ),
    tokens: sumTokenUsage(outcomes.map(({ tokens }) => tokens)),
    warnings: outcomes.flatMap(({ warning }) => (warning ? [warning] : [])),
  });
};

// Un JSON mal formé ou tronqué varie d'un appel à l'autre ; le reste (quota,
// panne) a déjà été retenté par le service.
const isTransientForTri = (error: LlmError): boolean =>
  error.kind === 'invalid_json' || error.kind === 'truncated';

const classifyBatch = async (
  llm: Pick<LlmService, 'generateStructured'>,
  batch: IndexedUnit[],
  signal?: AbortSignal
): Promise<
  Result<{ entries: ClassifyEntry[]; tokens: TokenUsage }, LlmError>
> => {
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
    entries: completion.data.data.filter((entry) => requested.has(entry.index)),
    tokens: completion.data.tokens,
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
