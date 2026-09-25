import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { Result, success } from '@tet/backend/utils/result.type';
import { PlanSkeleton } from '../../models/plan-skeleton';
import { DocumentUnit } from '../segment-document/document-unit';
import { classifyUnits, UnitCategory } from './classify-units';
import { extractSkeleton } from './extract-skeleton';

export type ScoutUnitsResult = {
  keptUnits: DocumentUnit[];
  skeleton: PlanSkeleton | null;
  discardedCount: number;
  tokens: TokenUsage;
};

/**
 * Écarte ce qui ne contient pas d'action (diagnostic, éditorial) et relève
 * le squelette du plan. Un tri léger peut se tromper : une unité que le
 * découpage tient déjà pour une fiche, ou que le modèle a oubliée, reste.
 */
export const scoutUnits = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { units, signal }: { units: DocumentUnit[]; signal?: AbortSignal }
): Promise<Result<ScoutUnitsResult, LlmError>> => {
  const classified = await classifyUnits(llm, { units, signal });
  if (!classified.success) {
    return classified;
  }
  const { categories } = classified.data;
  const keptUnits = units.filter((unit, index) =>
    isKept(unit, categories.get(index))
  );
  const structureUnits = units.filter(
    (_, index) => categories.get(index) === 'structure'
  );

  const skeleton = await extractSkeleton(llm, {
    units,
    structureUnits,
    signal,
  });
  if (!skeleton.success) {
    return skeleton;
  }

  return success({
    // Tout écarter serait louche : on lit alors tout, comme sans repérage.
    keptUnits: keptUnits.length > 0 ? keptUnits : units,
    skeleton: skeleton.data.skeleton,
    discardedCount: keptUnits.length > 0 ? units.length - keptUnits.length : 0,
    tokens: sumTokenUsage([classified.data.tokens, skeleton.data.tokens]),
  });
};

const isKept = (
  unit: DocumentUnit,
  category: UnitCategory | undefined
): boolean =>
  unit.kind === 'fiche' ||
  unit.kind === 'table' ||
  category === undefined ||
  category === 'fiche_action' ||
  category === 'structure';
