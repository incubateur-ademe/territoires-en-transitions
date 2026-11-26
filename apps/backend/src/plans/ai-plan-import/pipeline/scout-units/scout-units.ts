import { describeLlmError, LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { sumTokenUsage, TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { stripTitleNumber } from '../../adapters/normalize-plan-labels';
import type { ReadingChoices } from '../../models/import-question';
import type {
  AnalysisAbandonedError,
  ReadingStats,
} from '../../models/model-doubt';
import { PlanSkeleton } from '../../models/plan-skeleton';
import { titlesMatch } from '../extract-actions/similar-titles';
import { DocumentUnit } from '../segment-document/document-unit';
import {
  isActionsSummary,
  listActionsWithoutFiche,
  selectActionPlanUnits,
} from '../segment-document/list-actions-without-fiche';
import { classifyUnits, UnitCategory } from './classify-units';
import { extractSkeleton } from './extract-skeleton';
import { judgeModelDoubt } from './verify-model-doubt';

export type ScoutUnitsResult = {
  keptUnits: DocumentUnit[];
  skeleton: PlanSkeleton | null;
  discardedCount: number;
  tokens: TokenUsage;
  warnings: string[];
  /** Le doute du modèle, vérifié ou non, pour caler les seuils. */
  details: Record<string, number>;
};

export type ScoutUnitsError = LlmError | AnalysisAbandonedError;

/**
 * Écarte ce qui ne contient pas d'action (diagnostic, éditorial, engagements
 * des partenaires) et relève le squelette du plan. Un tri léger peut se
 * tromper : une unité que le découpage tient déjà pour une fiche, ou que le
 * modèle a oubliée, reste.
 */
export const scoutUnits = async (
  llm: Pick<LlmService, 'generateStructured'>,
  {
    units: allUnits,
    themeGrouping,
    actionsWithoutFiche = 'all',
    readingStats,
    actionsReadByCode = 0,
    planTypeLabel,
    signal,
  }: {
    units: DocumentUnit[];
    /** La réponse sur les thèmes que la synthèse réunit, quand elle est donnée. */
    themeGrouping?: ReadingChoices['themeGrouping'];
    /** La réponse sur les actions listées sans fiche ; toutes par défaut. */
    actionsWithoutFiche?: ReadingChoices['actionsWithoutFiche'];
    /** Absent d'un tableur et des points de reprise antérieurs. */
    readingStats?: ReadingStats;
    /** Les actions d'un tableur que le code a déjà lues. */
    actionsReadByCode?: number;
    planTypeLabel?: string;
    signal?: AbortSignal;
  }
): Promise<Result<ScoutUnitsResult, ScoutUnitsError>> => {
  const { readable, units } = selectActionPlanUnits(allUnits);
  const setAsideCount = allUnits.length - units.length;
  const classified = await classifyUnits(llm, {
    units,
    planTypeLabel,
    signal,
  });
  if (!classified.success) {
    return classified;
  }
  const { categories } = classified.data;
  // Avec des fiches, le sommaire et les tableaux récapitulatifs redisent ce
  // qu'elles détaillent : ils servent au squelette, pas à l'extraction.
  const withFiches = units.some((unit) => unit.kind === 'fiche');
  // Sans les actions qu'aucune fiche ne détaille, leurs récapitulatifs ne
  // servent plus qu'au squelette, même classés `fiche_action` par le tri.
  const setAsideSummary = (unit: DocumentUnit) =>
    actionsWithoutFiche === 'with-fiche' && isActionsSummary(unit);
  const structureUnits = units.filter(
    (unit, index) =>
      categories.get(index) === 'structure' || setAsideSummary(unit)
  );
  const listsActionsWithoutFiche = listActionsWithoutFiche(units);
  const keptUnits = units.filter(
    (unit, index) =>
      !setAsideSummary(unit) &&
      (isKept(unit, categories.get(index), withFiches) ||
        listsActionsWithoutFiche(unit))
  );

  // Sans squelette, la mise en cohérence est sautée : l'import y perd en
  // finesse, pas en contenu.
  const setAsideSummaries = summariesOfFiches(
    units,
    readable.filter((unit) => !units.includes(unit))
  );
  const skeleton = await extractSkeleton(llm, {
    units,
    structureUnits: [...setAsideSummaries, ...structureUnits],
    themeGrouping,
    signal,
  });
  const skeletonWarnings = skeleton.success
    ? []
    : [`Squelette du plan non relevé : ${describeLlmError(skeleton.error)}`];
  const judgement =
    skeleton.success && skeleton.data.modelDoubt
      ? judgeModelDoubt(skeleton.data.modelDoubt, {
          units: allUnits,
          sortedAsFiche: [...categories.values()].includes('fiche_action'),
          sortingFailed: classified.data.warnings.length > 0,
          readingStats,
          themeGroupingAnswered: themeGrouping !== undefined,
          actionsReadByCode,
        })
      : null;
  // Seuls le tri et le squelette ont été payés : s'arrêter ici coûte peu.
  if (judgement?.abandon) {
    return failure(judgement.abandon);
  }

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
    warnings: [
      ...classified.data.warnings,
      ...skeletonWarnings,
      ...(judgement?.warning ? [judgement.warning] : []),
    ],
    details: {
      ...judgement?.details,
      ...(skeleton.success &&
        skeleton.data.axesFromCode && { skeletonAxesFromCode: 1 }),
    },
  });
};

/**
 * Le sommaire placé avant la partie actions (« 14 ACTIONS PRIORITAIRES » et
 * leurs thèmes) : mis de côté avec le diagnostic, il est souvent seul à
 * donner les regroupements des fiches. Sa page en redit au moins la moitié ;
 * sur deux colonnes, la lecture peut le couper en plusieurs unités, toutes
 * gardées.
 */
const summariesOfFiches = (
  units: DocumentUnit[],
  setAside: DocumentUnit[]
): DocumentUnit[] => {
  const titles = units.flatMap((unit) =>
    unit.kind === 'fiche' && !unit.continued && unit.title
      ? [stripTitleNumber(unit.title.replace(LEADING_NUMBER, ''))]
      : []
  );
  if (titles.length < MIN_RESTATED_FICHES) {
    return [];
  }
  const needed = Math.max(MIN_RESTATED_FICHES, Math.ceil(titles.length / 2));
  const restatedByPage = new Map<number, Set<number>>();
  const pagesByUnit = new Map<DocumentUnit, Set<number>>();
  for (const unit of setAside) {
    for (const line of unit.lines) {
      const text = line.text.trim().replace(LEADING_NUMBER, '');
      const index = titles.findIndex((title) => titlesMatch(text, title));
      if (index === -1) {
        continue;
      }
      restatedByPage.set(
        line.pageIndex,
        (restatedByPage.get(line.pageIndex) ?? new Set()).add(index)
      );
      pagesByUnit.set(
        unit,
        (pagesByUnit.get(unit) ?? new Set()).add(line.pageIndex)
      );
    }
  }
  return setAside.filter((unit) =>
    [...(pagesByUnit.get(unit) ?? [])].some(
      (page) => (restatedByPage.get(page)?.size ?? 0) >= needed
    )
  );
};

const LEADING_NUMBER = /^(?:\d{1,3}(?:\.\d{1,3})*[.)]?\s+)/u;
const MIN_RESTATED_FICHES = 3;

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
