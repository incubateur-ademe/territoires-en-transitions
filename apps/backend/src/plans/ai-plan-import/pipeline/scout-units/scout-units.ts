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
// Un plan range ses fiches dans une partie à part (programme d'actions,
// fiches actions), après le diagnostic et la stratégie : quand cette partie
// est titrée et contient des fiches, le reste du document n'a pas d'action à
// donner. Il ne sert plus qu'au squelette.
const ACTION_PLAN_SECTION =
  /(?:plan|programme) d['’]actions?|fiches?[\s-]actions?|catalogue des actions|plan op[ée]rationnel/i;
// « Feuille de route mobilité », « Fiches projets » : une partie d'un plan
// plus large, qui n'en réunit pas toujours toutes les fiches. Seule la prose
// hors de cette partie est écartée ; ses autres fiches passent au tri.
const PARTIAL_ACTION_PLAN_SECTION =
  /fiches?[\s-]projets?|programme op[ée]rationnel|feuille de route/i;
const MIN_FICHES_IN_ACTION_PLAN = 3;
// « Action à engager 31 : … », « Mesure 4.2 – … » : une ligne d'un tableau
// récapitulatif, avec son numéro.
const NUMBERED_ACTION =
  /^(?:actions?|mesures?|op[ée]rations?|projets?)\b[^:\n]{0,30}?(\d+(?:\.\d+)*)\s*[:.–—-]/iu;
// Un récapitulatif qui numérote nettement plus d'actions qu'il n'y a de
// fiches en porte que nulle fiche ne détaille.
const MIN_ACTIONS_WITHOUT_FICHE = 3;
const ACTIONS_WITHOUT_FICHE_RATIO = 1.25;

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
    planTypeLabel,
    signal,
  }: { units: DocumentUnit[]; planTypeLabel?: string; signal?: AbortSignal }
): Promise<Result<ScoutUnitsResult, LlmError>> => {
  const readable = allUnits.filter(
    (unit) => !unit.section || !PARTNER_SECTION.test(unit.section)
  );
  const inPart = (pattern: RegExp) =>
    readable.filter((unit) => unit.section && pattern.test(unit.section));
  const holdsFiches = (part: DocumentUnit[]) =>
    part.filter((unit) => unit.kind === 'fiche').length >=
    MIN_FICHES_IN_ACTION_PLAN;
  const actionPlan = inPart(ACTION_PLAN_SECTION);
  const partialPlan = inPart(PARTIAL_ACTION_PLAN_SECTION);
  const units = holdsFiches(actionPlan)
    ? actionPlan
    : holdsFiches(partialPlan)
    ? readable.filter(
        (unit) => partialPlan.includes(unit) || unit.kind === 'fiche'
      )
    : readable;
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
  const structureUnits = units.filter(
    (_, index) => categories.get(index) === 'structure'
  );
  const listsActionsWithoutFiche = listActionsWithoutFiche(units);
  const keptUnits = units.filter(
    (unit, index) =>
      isKept(unit, categories.get(index), withFiches) ||
      listsActionsWithoutFiche(unit)
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

const numberedActionsOf = (unit: DocumentUnit): string[] =>
  unit.text
    .split('\n')
    .flatMap((line) => line.trim().match(NUMBERED_ACTION)?.[1] ?? []);

/**
 * Les tableaux à garder malgré les fiches, quoi qu'en dise le tri : ensemble,
 * ils numérotent plus d'actions que le document n'a de fiches (51 actions au
 * tableau, 24 fiches pour les seules actions nouvelles). Le tri ne voit que
 * le début et la fin d'un extrait ; le compte, lui, porte sur toutes ses
 * lignes. Un récapitulatif qui redit les fiches, à peu près autant qu'elles,
 * reste écarté.
 */
const listActionsWithoutFiche = (
  units: DocumentUnit[]
): ((unit: DocumentUnit) => boolean) => {
  // Une fiche découpée en fenêtres reste une fiche.
  const ficheCount = units.filter(
    (unit) => unit.kind === 'fiche' && !unit.continued
  ).length;
  const listed = new Set(
    units.filter((unit) => unit.kind !== 'fiche').flatMap(numberedActionsOf)
  ).size;
  const hasMore =
    ficheCount > 0 &&
    listed - ficheCount >= MIN_ACTIONS_WITHOUT_FICHE &&
    listed >= ACTIONS_WITHOUT_FICHE_RATIO * ficheCount;
  return (unit) =>
    hasMore && numberedActionsOf(unit).length >= MIN_ACTIONS_WITHOUT_FICHE;
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
