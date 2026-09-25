import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DisableableField } from '../../models/disableable-field';
import { ExtractedAction } from '../../models/extracted-action';
import { PlanSkeleton, renderSkeleton } from '../../models/plan-skeleton';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import {
  STRUCTURATION_SYSTEM_PROMPT,
  STRUCTURATION_USER_PROMPT,
} from '../../prompts/structuration.prompt';
import { DocumentUnit } from '../segment-document/document-unit';
import { renderUnit } from '../segment-document/render-unit';
import { ExtractActionsError, ExtractActionsResult } from './extract-actions';
import { extractionResponseSchema } from './extract-actions.schema';
import { extractionResponseToExtractedActions } from './extraction-response-to-extracted-actions';
import { ChunkedActions, mergeChunkActions } from './merge-chunk-actions';

// Le limiteur du service borne les appels réels ; ceci borne le travail en vol.
export const STRUCTURATION_CONCURRENCY = 4;
/**
 * Unités voisines regroupées par appel. Albert compte aussi les requêtes par
 * minute (10) : des paquets de cette taille remplissent le quota de tokens
 * sans le dépasser, et restent loin de la taille où le modèle résume.
 */
export const STRUCTURATION_PACK_TOKENS = 9_000;
// gpt-oss raisonne avant de répondre, et ce raisonnement se prend sur le
// budget de réponse sans qu'Albert le déclare : il faut large. Le quota ne
// compte que les tokens d'entrée.
const STRUCTURATION_MAX_OUTPUT_TOKENS = 32_000;
const STRUCTURATION_RETRY_MAX_OUTPUT_TOKENS = 64_000;
/** Part des paquets qu'on accepte de perdre avant de faire échouer l'import. */
const MAX_SKIPPED_PACK_RATIO = 0.2;

export type StructureUnitsInput = {
  units: DocumentUnit[];
  skeleton: PlanSkeleton | null;
  instructions: string;
  disabledFields: DisableableField[];
  currentDate: string;
  signal?: AbortSignal;
};

export type StructureUnitsResult = ExtractActionsResult & {
  /** Le texte de chaque paquet tel qu'envoyé au modèle, dans l'ordre. */
  chunks: string[];
  /** Paquets écartés après une nouvelle tentative, pour le rapport. */
  warnings: string[];
};

/**
 * Structure chaque unité séparément, en parallèle : à cette taille, le modèle
 * extrait au lieu de résumer. Les actions sont ensuite recollées dans l'ordre
 * du document, les doublons de fenêtrage fusionnés.
 */
export const structureUnits = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    units,
    skeleton,
    instructions,
    disabledFields,
    currentDate,
    signal,
  }: StructureUnitsInput
): Promise<Result<StructureUnitsResult, ExtractActionsError>> => {
  const count = units.length;
  const packs = packUnits(units, STRUCTURATION_PACK_TOKENS);
  const chunks = packs.map((pack) =>
    pack
      .map(({ unit, index }) => renderUnit(unit, { index, count }))
      .join('\n\n')
  );
  const systemInstruction = generatePrompt(STRUCTURATION_SYSTEM_PROMPT, {
    dateDuJour: currentDate,
  });
  const ignoreDirective = buildIgnoreDirective(disabledFields);
  const renderedSkeleton = renderSkeleton(skeleton);

  const outcomes = await mapWithConcurrency(
    packs.map((pack, packIndex) => ({ pack, packIndex })),
    STRUCTURATION_CONCURRENCY,
    ({ pack, packIndex }) =>
      structurePack(llm, {
        systemInstruction,
        prompt:
          ignoreDirective +
          generatePrompt(STRUCTURATION_USER_PROMPT, {
            squelette: renderedSkeleton,
            instructions,
            position: describePackPosition(pack, count),
            extrait: chunks[packIndex],
          }),
        signal,
      })
  );

  const skipped = outcomes.flatMap((outcome, packIndex) =>
    outcome.success ? [] : [{ packIndex, error: outcome.error }]
  );
  if (skipped.length > Math.floor(packs.length * MAX_SKIPPED_PACK_RATIO)) {
    return failure(skipped[0].error);
  }

  let merged: ChunkedActions = { actions: [], chunkIndexByAction: [] };
  const usages: TokenUsage[] = [];
  outcomes.forEach((outcome, chunkIndex) => {
    if (outcome.success) {
      usages.push(outcome.data.tokens);
      merged = mergeChunkActions(merged, outcome.data.actions, chunkIndex);
    }
  });
  if (merged.actions.length === 0) {
    return failure(skipped[0]?.error ?? { kind: 'no_actions_extracted' });
  }
  return success({
    ...merged,
    chunks,
    tokens: sumTokenUsage(usages),
    warnings: skipped.map(
      ({ packIndex, error }) =>
        `Extrait écarté (${describePackPosition(packs[packIndex], count)}) : ${
          error.kind
        }`
    ),
  });
};

type IndexedUnit = { unit: DocumentUnit; index: number };

/** Unités voisines, dans l'ordre, jusqu'à `maxTokens` par paquet. */
export const packUnits = (
  units: DocumentUnit[],
  maxTokens: number
): IndexedUnit[][] => {
  const packs: IndexedUnit[][] = [];
  let current: IndexedUnit[] = [];
  let tokens = 0;
  units.forEach((unit, index) => {
    if (current.length > 0 && tokens + unit.tokenEstimate > maxTokens) {
      packs.push(current);
      current = [];
      tokens = 0;
    }
    current.push({ unit, index });
    tokens += unit.tokenEstimate;
  });
  if (current.length > 0) {
    packs.push(current);
  }
  return packs;
};

const describePackPosition = (pack: IndexedUnit[], count: number): string => {
  const first = pack[0];
  const last = pack[pack.length - 1];
  const extraits =
    pack.length === 1
      ? `extrait ${first.index + 1}`
      : `extraits ${first.index + 1} à ${last.index + 1}`;
  return `${extraits} sur ${count}, pages ${first.unit.pageStart + 1} à ${
    last.unit.pageEnd + 1
  }`;
};

/**
 * Une réponse tronquée ou mal formée se retente une fois, avec plus de place
 * pour une réponse tronquée : le raisonnement du modèle varie d'un appel à
 * l'autre.
 */
const structurePack = async (
  llm: Pick<LlmService, 'generateStructured'>,
  args: { systemInstruction: string; prompt: string; signal?: AbortSignal }
): Promise<
  Result<{ actions: ExtractedAction[]; tokens: TokenUsage }, LlmError>
> => {
  const first = await structureUnit(llm, {
    ...args,
    maxOutputTokens: STRUCTURATION_MAX_OUTPUT_TOKENS,
  });
  if (
    first.success ||
    (first.error.kind !== 'truncated' && first.error.kind !== 'invalid_json')
  ) {
    return first;
  }
  return structureUnit(llm, {
    ...args,
    maxOutputTokens:
      first.error.kind === 'truncated'
        ? STRUCTURATION_RETRY_MAX_OUTPUT_TOKENS
        : STRUCTURATION_MAX_OUTPUT_TOKENS,
  });
};

const structureUnit = async (
  llm: Pick<LlmService, 'generateStructured'>,
  args: {
    systemInstruction: string;
    prompt: string;
    maxOutputTokens: number;
    signal?: AbortSignal;
  }
): Promise<
  Result<{ actions: ExtractedAction[]; tokens: TokenUsage }, LlmError>
> => {
  const completion = await llm.generateStructured({
    tier: 'strong',
    systemInstruction: args.systemInstruction,
    prompt: args.prompt,
    schema: extractionResponseSchema,
    maxOutputTokens: args.maxOutputTokens,
    signal: args.signal,
  });
  if (!completion.success) {
    return completion;
  }
  return success({
    actions: extractionResponseToExtractedActions(completion.data.data),
    tokens: completion.data.tokens,
  });
};
