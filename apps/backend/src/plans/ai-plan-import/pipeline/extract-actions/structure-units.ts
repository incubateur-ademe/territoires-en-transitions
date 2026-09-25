import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { DisableableField } from '../../models/disableable-field';
import { ExtractedAction } from '../../models/extracted-action';
import { PlanSkeleton, renderSkeleton } from '../../models/plan-skeleton';
import { buildIgnoreDirective } from '../../prompts/ignore-directive';
import {
  STRUCTURATION_SYSTEM_PROMPT,
  STRUCTURATION_USER_PROMPT,
} from '../../prompts/structuration.prompt';
import { DocumentUnit } from '../segment-document/document-unit';
import {
  describeUnitPosition,
  renderUnit,
} from '../segment-document/render-unit';
import { ExtractActionsError, ExtractActionsResult } from './extract-actions';
import { extractionResponseSchema } from './extract-actions.schema';
import { extractionResponseToExtractedActions } from './extraction-response-to-extracted-actions';
import { ChunkedActions, mergeChunkActions } from './merge-chunk-actions';

// Le limiteur du service borne les appels réels ; ceci borne le travail en vol.
export const STRUCTURATION_CONCURRENCY = 4;
// Une fiche donne rarement plus de quelques actions : inutile de réserver plus.
const STRUCTURATION_MAX_OUTPUT_TOKENS = 8_000;

export type StructureUnitsInput = {
  units: DocumentUnit[];
  skeleton: PlanSkeleton | null;
  instructions: string;
  disabledFields: DisableableField[];
  currentDate: string;
  signal?: AbortSignal;
};

export type StructureUnitsResult = ExtractActionsResult & {
  /** Le texte de chaque unité tel qu'envoyé au modèle, dans l'ordre. */
  chunks: string[];
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
  const chunks = units.map((unit, index) => renderUnit(unit, { index, count }));
  const systemInstruction = generatePrompt(STRUCTURATION_SYSTEM_PROMPT, {
    dateDuJour: currentDate,
  });
  const ignoreDirective = buildIgnoreDirective(disabledFields);
  const renderedSkeleton = renderSkeleton(skeleton);

  const outcomes = await mapWithConcurrency(
    units.map((unit, index) => ({ unit, index })),
    STRUCTURATION_CONCURRENCY,
    ({ unit, index }) =>
      structureUnit(llm, {
        systemInstruction,
        prompt:
          ignoreDirective +
          generatePrompt(STRUCTURATION_USER_PROMPT, {
            squelette: renderedSkeleton,
            instructions,
            position: describeUnitPosition(unit, { index, count }),
            extrait: chunks[index],
          }),
        signal,
      })
  );
  const combined = combineResults(outcomes);
  if (!combined.success) {
    return combined;
  }

  let merged: ChunkedActions = { actions: [], chunkIndexByAction: [] };
  const usages: TokenUsage[] = [];
  combined.data.forEach(({ actions, tokens }, chunkIndex) => {
    usages.push(tokens);
    merged = mergeChunkActions(merged, actions, chunkIndex);
  });
  if (merged.actions.length === 0) {
    return failure({ kind: 'no_actions_extracted' });
  }
  return success({ ...merged, chunks, tokens: sumTokenUsage(usages) });
};

const structureUnit = async (
  llm: Pick<LlmService, 'generateStructured'>,
  args: { systemInstruction: string; prompt: string; signal?: AbortSignal }
): Promise<
  Result<{ actions: ExtractedAction[]; tokens: TokenUsage }, LlmError>
> => {
  const completion = await llm.generateStructured({
    tier: 'strong',
    systemInstruction: args.systemInstruction,
    prompt: args.prompt,
    schema: extractionResponseSchema,
    maxOutputTokens: STRUCTURATION_MAX_OUTPUT_TOKENS,
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
