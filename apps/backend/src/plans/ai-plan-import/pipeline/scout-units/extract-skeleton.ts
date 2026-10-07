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
import { titlesMatch } from '../extract-actions/similar-titles';
import { DocumentUnit } from '../segment-document/document-unit';

// Les extraits de structure sont rarement longs ; au-delà, le sommaire suffit.
const STRUCTURE_MAX_TOKENS = 15_000;
// Le squelette tient en quelques centaines de tokens ; le reste revient au
// raisonnement de gpt-oss, qui se prend sur ce budget sans être déclaré.
const SKELETON_MAX_OUTPUT_TOKENS = 16_000;

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
  const ficheTitles = units.flatMap((unit) =>
    unit.kind === 'fiche' && unit.title && !unit.continued ? [unit.title] : []
  );
  const extraits = capByTokens(structureUnits, STRUCTURE_MAX_TOKENS);
  if (titles.length === 0 && extraits.length === 0) {
    return success({ skeleton: null, tokens: emptyTokenUsage() });
  }

  const completion = await llm.generateStructured({
    tier: 'strong',
    prompt: generatePrompt(SQUELETTE_PROMPT, {
      titres: titles.length > 0 ? titles.join('\n') : '(aucun titre relevé)',
      fiches:
        ficheTitles.length > 0
          ? ficheTitles.join('\n')
          : '(aucune fiche relevée)',
      extraits:
        extraits.length > 0
          ? extraits.join('\n\n')
          : '(aucun extrait de structure)',
    }),
    schema: planSkeletonSchema,
    maxOutputTokens: SKELETON_MAX_OUTPUT_TOKENS,
    reasoningEffort: 'low',
    signal,
  });
  if (!completion.success) {
    return completion;
  }
  const skeleton = withoutFicheSousAxes(completion.data.data, ficheTitles);
  return success({
    skeleton: skeleton.axes.length > 0 ? skeleton : null,
    tokens: completion.data.tokens,
  });
};

/**
 * Un sous-axe qui porte le titre d'une fiche est la fiche elle-même, vue dans
 * le sommaire : garder ce niveau doublerait chaque action d'un sous-axe vide.
 */
const withoutFicheSousAxes = (
  skeleton: PlanSkeleton,
  ficheTitles: string[]
): PlanSkeleton => ({
  axes: skeleton.axes.map((axe) => ({
    ...axe,
    sousAxes: axe.sousAxes.filter(
      (sousAxe) =>
        !ficheTitles.some((fiche) =>
          titlesMatch(fiche, `${sousAxe.numero} ${sousAxe.titre}`)
        )
    ),
  })),
});

/**
 * Les chemins de titres, dans l'ordre du document, chacun une fois, rangés
 * sous la partie du document qui les contient quand elle est titrée.
 */
const distinctHeadingPaths = (units: DocumentUnit[]): string[] => {
  const seen = new Set<string>();
  const titles: string[] = [];
  let currentSection: string | undefined;
  for (const unit of units) {
    const indent = unit.section ? 1 : 0;
    unit.headingPath.forEach((title, depth) => {
      const key = `${unit.section ?? ''}|${depth}:${title}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      if (unit.section && unit.section !== currentSection) {
        currentSection = unit.section;
        titles.push(`Partie « ${unit.section} »`);
      }
      titles.push(`${'  '.repeat(indent + depth)}${title}`);
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
