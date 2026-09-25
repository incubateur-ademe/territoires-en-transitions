import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';
import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { generatePrompt } from '@tet/backend/utils/llm/prompt-template';
import {
  emptyTokenUsage,
  TokenUsage,
} from '@tet/backend/utils/llm/token-usage';
import { Result, success } from '@tet/backend/utils/result.type';
import { PlanSkeleton, planSkeletonSchema } from '../../models/plan-skeleton';
import { SQUELETTE_PROMPT } from '../../prompts/squelette.prompt';
import { DocumentUnit } from '../segment-document/document-unit';

// Les extraits de structure sont rarement longs ; au-delà, le sommaire suffit.
const STRUCTURE_MAX_TOKENS = 15_000;
const SKELETON_MAX_OUTPUT_TOKENS = 4_000;

export type ExtractSkeletonResult = {
  skeleton: PlanSkeleton | null;
  tokens: TokenUsage;
};

/**
 * Les axes et sous-axes du plan, déduits une fois pour toutes des titres
 * relevés et des extraits de structure. Rien à donner : pas de squelette.
 */
export const extractSkeleton = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    units,
    structureUnits,
    signal,
  }: {
    units: DocumentUnit[];
    structureUnits: DocumentUnit[];
    signal?: AbortSignal;
  }
): Promise<Result<ExtractSkeletonResult, LlmError>> => {
  const titles = distinctHeadingPaths(units);
  const extraits = capByTokens(structureUnits, STRUCTURE_MAX_TOKENS);
  if (titles.length === 0 && extraits.length === 0) {
    return success({ skeleton: null, tokens: emptyTokenUsage() });
  }

  const completion = await llm.generateStructured({
    tier: 'strong',
    prompt: generatePrompt(SQUELETTE_PROMPT, {
      titres: titles.length > 0 ? titles.join('\n') : '(aucun titre relevé)',
      extraits:
        extraits.length > 0
          ? extraits.join('\n\n')
          : '(aucun extrait de structure)',
    }),
    schema: planSkeletonSchema,
    maxOutputTokens: SKELETON_MAX_OUTPUT_TOKENS,
    signal,
  });
  if (!completion.success) {
    return completion;
  }
  const { data: skeleton, tokens } = completion.data;
  return success({
    skeleton: skeleton.axes.length > 0 ? skeleton : null,
    tokens,
  });
};

/** Les chemins de titres, dans l'ordre du document, chacun une fois. */
const distinctHeadingPaths = (units: DocumentUnit[]): string[] => {
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const unit of units) {
    unit.headingPath.forEach((title, depth) => {
      const key = `${depth}:${title}`;
      if (!seen.has(key)) {
        seen.add(key);
        titles.push(`${'  '.repeat(depth)}${title}`);
      }
    });
  }
  return titles;
};

const capByTokens = (units: DocumentUnit[], maxTokens: number): string[] => {
  const kept: string[] = [];
  let tokens = 0;
  for (const unit of units) {
    tokens += estimateTokenCount(unit.text);
    if (tokens > maxTokens) break;
    kept.push(unit.text);
  }
  return kept;
};
