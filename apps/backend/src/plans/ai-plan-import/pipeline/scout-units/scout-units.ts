import { describeLlmError, LlmError } from '@tet/backend/utils/llm/llm.errors';
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
  warnings: string[];
};

// Les engagements des partenaires décrivent ce que d'autres feront, pas le
// plan de la collectivité : une partie ainsi titrée n'est pas lue.
const PARTNER_SECTION = /partenaire/i;
// Un PCAET suit une structure réglementaire (diagnostic, stratégie, programme
// d'actions, suivi) : quand le programme d'actions est titré et contient des
// fiches, le reste du document n'a pas d'action à donner. Il ne sert plus
// qu'au squelette.
const ACTION_PLAN_SECTION =
  /(?:plan|programme) d['’]actions?|fiches?[\s-]actions?|catalogue des actions|plan op[ée]rationnel/i;
const MIN_FICHES_IN_ACTION_PLAN = 3;

/**
 * Écarte ce qui ne contient pas d'action (diagnostic, éditorial, engagements
 * des partenaires) et relève le squelette du plan. Un tri léger peut se
 * tromper : une unité que le découpage tient déjà pour une fiche, ou que le
 * modèle a oubliée, reste.
 */
export const scoutUnits = async (
  llm: Pick<LlmService, 'generateStructured'>,
  { units: allUnits, signal }: { units: DocumentUnit[]; signal?: AbortSignal }
): Promise<Result<ScoutUnitsResult, LlmError>> => {
  const readable = allUnits.filter(
    (unit) => !unit.section || !PARTNER_SECTION.test(unit.section)
  );
  const actionPlan = readable.filter(
    (unit) => unit.section && ACTION_PLAN_SECTION.test(unit.section)
  );
  const hasActionPlan =
    actionPlan.filter((unit) => unit.kind === 'fiche').length >=
    MIN_FICHES_IN_ACTION_PLAN;
  const units = hasActionPlan ? actionPlan : readable;
  const setAsideCount = allUnits.length - units.length;
  const classified = await classifyUnits(llm, { units, signal });
  if (!classified.success) {
    return classified;
  }
  const { categories } = classified.data;
  // Avec des fiches, le sommaire et les tableaux récapitulatifs redisent ce
  // qu'elles détaillent : ils servent au squelette, pas à l'extraction.
  const withFiches = units.some((unit) => unit.kind === 'fiche');
  const keptUnits = units.filter((unit, index) =>
    isKept(unit, categories.get(index), withFiches)
  );
  const structureUnits = units.filter(
    (_, index) => categories.get(index) === 'structure'
  );

  // Sans squelette, la mise en cohérence est sautée : l'import y perd en
  // finesse, pas en contenu.
  const skeleton = await extractSkeleton(llm, {
    units,
    structureUnits,
    signal,
  });
  const skeletonWarnings = skeleton.success
    ? []
    : [`Squelette du plan non relevé : ${describeLlmError(skeleton.error)}`];

  return success({
    // Tout écarter serait louche : on lit alors tout, comme sans repérage.
    keptUnits: keptUnits.length > 0 ? keptUnits : units,
    skeleton: skeleton.success ? skeleton.data.skeleton : null,
    discardedCount:
      setAsideCount +
      (keptUnits.length > 0 ? units.length - keptUnits.length : 0),
    tokens: sumTokenUsage([
      classified.data.tokens,
      ...(skeleton.success ? [skeleton.data.tokens] : []),
    ]),
    warnings: [...classified.data.warnings, ...skeletonWarnings],
  });
};

const isKept = (
  unit: DocumentUnit,
  category: UnitCategory | undefined,
  withFiches: boolean
): boolean =>
  unit.kind === 'fiche' ||
  unit.kind === 'table' ||
  category === undefined ||
  category === 'fiche_action' ||
  (category === 'structure' && !withFiches);
