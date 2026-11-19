import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';
import { DocumentPage } from '../document/document-page';
import { DetectedHeading } from './detect-headings';
import { buildUnit, DocumentUnit, UnitKind, UnitLine } from './document-unit';
import {
  FICHE_LEVEL,
  HeadingMatch,
  isFicheLabel,
  SECTION_LEVEL,
} from './heading-patterns';

export type CutUnitsOptions = {
  /** En dessous, l'unité est fusionnée avec sa voisine. */
  minTokens: number;
  /** Au-dessus, l'unité est fenêtrée. */
  maxTokens: number;
  overlapTokens: number;
};

// Une fiche se reconnaît aussi à ses champs : trois libellés rapprochés sans
// titre de fiche, et c'est une fiche dont le titre a échappé aux motifs.
const FICHE_LABEL_WINDOW_LINES = 12;
const FICHE_LABEL_MIN_COUNT = 3;
const RETRO_OPEN_LOOKBACK_LINES = 6;
const AXE_LEVEL = 1;
// Sous son titre, une fiche redit parfois son axe puis son orientation : à
// quelques lignes du titre, et suivis de son contenu, pas d'une autre fiche.
// C'est une convention du document : la moitié de ses fiches au moins la
// suivent, sinon l'axe qui vient après une fiche courte ouvre la suite.
const FICHE_PATH_MAX_LINES = 6;
const FICHE_PATH_BODY_LINES = 12;
const MIN_FICHES_STATING_AXE = 3;
const FICHES_STATING_AXE_SHARE = 0.5;

type StackEntry = { level: number; label: string; number: string | null };

type OpenUnit = {
  lines: UnitLine[];
  headingPath: string[];
  kind: UnitKind;
  section?: string;
  title?: string;
  /** L'axe qui couvre l'unité, le sien quand elle s'ouvre sur son titre. */
  axe?: string;
};

/**
 * Découpe le document aux frontières de fiches et de titres, puis ramène
 * chaque unité entre `minTokens` et `maxTokens`.
 */
export const cutUnits = (
  pages: DocumentPage[],
  headings: DetectedHeading[],
  options: CutUnitsOptions
): DocumentUnit[] => {
  const headingAt = new Map(
    headings.map((heading) => [
      `${heading.pageIndex}:${heading.lineIndex}`,
      heading.match,
    ])
  );
  const axeOfFiche = axesGivenBeforeFiches(headings);
  const fichesStateAxe = fichesStateTheirAxe(headings);
  const units: DocumentUnit[] = [];
  const axeOfUnit = new Map<DocumentUnit, string | undefined>();
  const stack: StackEntry[] = [];
  let section: string | undefined;
  let open: OpenUnit = { lines: [], headingPath: [], kind: 'unknown' };
  let labelsInWindow: number[] = [];

  const close = () => {
    if (open.lines.some((line) => line.text.trim().length > 0)) {
      const unit = buildUnit(open.lines, open.headingPath, open.kind, {
        section: open.section,
        title: open.title,
      });
      axeOfUnit.set(unit, open.axe);
      units.push(unit);
    }
  };
  const start = (kind: UnitKind, lines: UnitLine[] = [], title?: string) => {
    open = {
      lines,
      headingPath: pathOf(stack),
      kind,
      section,
      title,
      axe: stack[0]?.label,
    };
    labelsInWindow = [];
  };
  const isRecall = (heading: HeadingMatch) =>
    stack.some(
      (entry) =>
        entry.level === heading.level &&
        (entry.label === labelOf(heading) ||
          (heading.number !== null && entry.number === heading.number))
    );

  for (const page of pages) {
    page.lines.forEach((line, lineIndex) => {
      const unitLine: UnitLine = { ...line, pageIndex: page.index };
      const heading = headingAt.get(`${page.index}:${lineIndex}`);
      if (heading && heading.level === SECTION_LEVEL) {
        // Le nom de la partie repris en bandeau n'ouvre rien.
        if (labelOf(heading) === section) {
          open.lines.push(unitLine);
          return;
        }
        close();
        stack.length = 0;
        section = labelOf(heading);
        start('section', [unitLine]);
        return;
      }
      // Le rappel de l'axe ou de la fiche en bandeau n'ouvre rien, pas plus
      // qu'un intertitre en majuscules dans une fiche (« LES OUTILS »).
      if (
        heading &&
        (isRecall(heading) ||
          (open.kind === 'fiche' &&
            heading.kind === 'majuscules' &&
            heading.level >= 2))
      ) {
        open.lines.push(unitLine);
        return;
      }
      // « Action 31 : … » puis « Axe stratégique 4 : … » : la fiche dit où
      // elle se range. Ce titre d'axe ne la referme pas, il la rattache.
      const fiche = stack.at(-1);
      if (
        heading &&
        fichesStateAxe &&
        (heading.kind === 'axe' || heading.kind === 'orientation') &&
        heading.level < FICHE_LEVEL &&
        open.kind === 'fiche' &&
        fiche?.level === FICHE_LEVEL &&
        open.lines.length <= FICHE_PATH_MAX_LINES &&
        open.lines[0].pageIndex === page.index &&
        !contradictsFicheNumber(fiche.number, heading) &&
        !opensAnotherFiche(page.index, lineIndex)
      ) {
        popTo(stack, heading.level);
        stack.push({
          level: heading.level,
          label: labelOf(heading),
          number: heading.number,
        });
        open.headingPath = pathOf(stack);
        open.axe = stack[0].label;
        stack.push(fiche);
        open.lines.push(unitLine);
        return;
      }
      if (heading && heading.level >= FICHE_LEVEL) {
        close();
        popTo(stack, FICHE_LEVEL);
        const axe = heading.kind === 'fiche' ? axeOfFiche(heading) : null;
        if (axe && stack[0]?.label !== axe.label) {
          // Un sous-axe de cet axe, titré parmi les fiches, reste.
          const sousAxes = stack.filter(
            (entry) =>
              entry.level > AXE_LEVEL &&
              entry.number?.startsWith(`${axe.number}.`)
          );
          stack.length = 0;
          stack.push(axe, ...sousAxes);
        }
        start('fiche', [unitLine], labelOf(heading));
        stack.push({
          level: FICHE_LEVEL,
          label: labelOf(heading),
          number: heading.number,
        });
        return;
      }
      if (heading) {
        close();
        popTo(stack, heading.level);
        // Le chemin d'une unité, ce sont ses ancêtres : son propre titre est dans son texte.
        start('section', [unitLine]);
        stack.push({
          level: heading.level,
          label: labelOf(heading),
          number: heading.number,
        });
        open.axe = stack[0].label;
        return;
      }

      open.lines.push(unitLine);
      if (open.kind !== 'fiche' && isFicheLabel(line.text)) {
        const position = open.lines.length - 1;
        labelsInWindow = [...labelsInWindow, position].filter(
          (index) => position - index < FICHE_LABEL_WINDOW_LINES
        );
        if (labelsInWindow.length >= FICHE_LABEL_MIN_COUNT) {
          retroOpenFiche(labelsInWindow[0]);
        }
      }
    });
  }
  close();

  return windowUnits(
    mergeSmallUnits(units, options.minTokens, axeOfUnit),
    options
  );

  // Dans une liste de titres, l'axe qui suit une fiche ouvre les suivantes.
  function opensAnotherFiche(pageIndex: number, lineIndex: number): boolean {
    return Array.from({ length: FICHE_PATH_BODY_LINES }, (_, offset) =>
      headingAt.get(`${pageIndex}:${lineIndex + offset + 1}`)
    ).some((next) => next !== undefined && next.level >= FICHE_LEVEL);
  }

  function retroOpenFiche(firstLabelIndex: number) {
    const from = Math.max(0, firstLabelIndex - RETRO_OPEN_LOOKBACK_LINES);
    let titleIndex = -1;
    for (let index = firstLabelIndex - 1; index >= from; index--) {
      if (looksLikeTitle(open.lines[index].text)) {
        titleIndex = index;
        break;
      }
    }
    if (titleIndex <= 0) {
      // Pas de titre plausible : l'unité entière devient une fiche.
      open = { ...open, kind: 'fiche' };
      labelsInWindow = [];
      return;
    }
    const before = open.lines.slice(0, titleIndex);
    const fiche = open.lines.slice(titleIndex);
    open = { ...open, lines: before };
    close();
    start('fiche', fiche, fiche[0].text.trim());
  }
};

/**
 * Un plan qui ne nomme ses axes que dans un sommaire ou un tableau
 * récapitulatif, puis enchaîne ses fiches « 1.1 », « 1.2 », « 2.1 » sans
 * plus les rappeler : le numéro de la fiche dit son axe. Dès qu'un axe est
 * titré parmi les fiches, c'est lui qui fait foi et rien n'est déduit.
 */
const axesGivenBeforeFiches = (
  headings: DetectedHeading[]
): ((fiche: HeadingMatch) => StackEntry | null) => {
  // Les titres Markdown d'une page transcrite ne disent pas leur niveau :
  // seuls comptent ici les « Axe n » et les fiches qui se nomment.
  const firstFiche = headings.findIndex(({ match }) => match.kind === 'fiche');
  const isAxe = ({ match }: DetectedHeading) =>
    match.kind === 'axe' && match.number !== null;
  const axes = new Map(
    headings
      .slice(0, Math.max(0, firstFiche))
      .filter(isAxe)
      .map(({ match }) => [
        match.number as string,
        { level: AXE_LEVEL, label: labelOf(match), number: match.number },
      ])
  );
  if (
    firstFiche < 0 ||
    axes.size < 2 ||
    headings.slice(firstFiche).some(isAxe)
  ) {
    return () => null;
  }
  return (fiche) =>
    axes.get(fiche.number?.match(/^(\d{1,2})\.\d/)?.[1] ?? '') ?? null;
};

/** Le document redit-il l'axe de chaque fiche juste sous son titre ? */
const fichesStateTheirAxe = (headings: DetectedHeading[]): boolean => {
  const fiches = headings.filter(
    (heading) => heading.match.level >= FICHE_LEVEL
  );
  const stating = headings.filter((heading, index) => {
    const next = headings[index + 1];
    return (
      heading.match.level >= FICHE_LEVEL &&
      next !== undefined &&
      next.match.kind === 'axe' &&
      next.pageIndex === heading.pageIndex &&
      next.lineIndex - heading.lineIndex <= FICHE_PATH_MAX_LINES
    );
  });
  return (
    stating.length >= MIN_FICHES_STATING_AXE &&
    stating.length >= FICHES_STATING_AXE_SHARE * fiches.length
  );
};

/**
 * La fiche « 2.4.3 » ne se range pas sous l'« Axe 4 » qui la suit dans un
 * tableau, et « 1.1 Titre » sous la fiche « 1 » en est une partie, pas son axe.
 */
const contradictsFicheNumber = (
  ficheNumber: string | null,
  heading: HeadingMatch
): boolean => {
  if (ficheNumber === null || heading.number === null) {
    return false;
  }
  if (heading.number.startsWith(`${ficheNumber}.`)) {
    return true;
  }
  const [first, ...rest] = ficheNumber.split('.');
  return (
    rest.length > 0 &&
    heading.level === AXE_LEVEL &&
    /^\d+$/.test(first) &&
    /^\d+$/.test(heading.number) &&
    Number(first) !== Number(heading.number)
  );
};

const popTo = (stack: StackEntry[], level: number) => {
  while (stack.length > 0 && stack[stack.length - 1].level >= level) {
    stack.pop();
  }
};

const pathOf = (stack: StackEntry[]): string[] =>
  stack
    .filter((entry) => entry.level < FICHE_LEVEL)
    .map((entry) => entry.label);

const labelOf = (heading: HeadingMatch): string =>
  heading.number ? `${heading.number} ${heading.title}`.trim() : heading.title;

const looksLikeTitle = (text: string): boolean => {
  const trimmed = text.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 100 &&
    !/[.;:]$/.test(trimmed) &&
    !isFicheLabel(trimmed)
  );
};

/**
 * Une unité trop courte rejoint sa voisine, dans la même partie du document.
 * Sous un même axe, toujours. D'un axe à l'autre, seulement entre deux
 * petites unités : les lignes d'un sommaire (« Axe 1 … », « Axe 2 … ») ou
 * les éclats d'une frise se réunissent, mais un axe entier ne prend pas le
 * titre du suivant, et ce qui précède le premier axe (page de garde,
 * sommaire) ne prend pas ses premières actions. Une fiche reste seule ; les
 * extraits sont de toute façon regroupés par appel à la structuration.
 */
const mergeSmallUnits = (
  units: DocumentUnit[],
  minTokens: number,
  axeOfUnit: Map<DocumentUnit, string | undefined>
): DocumentUnit[] => {
  const merged: DocumentUnit[] = [];
  units.forEach((unit, index) => {
    const previous = merged.at(-1);
    if (
      previous === undefined ||
      previous.section !== unit.section ||
      previous.kind === 'fiche' ||
      unit.kind === 'fiche'
    ) {
      merged.push(unit);
      return;
    }
    const next = units[index + 1];
    const axe = axeOfUnit.get(unit);
    const previousAxe = axeOfUnit.get(previous);
    const previousIsSmall = previous.tokenEstimate < minTokens;
    const unitIsSmall = unit.tokenEstimate < minTokens;
    // Le titre d'un axe reste avec le contenu qu'il ouvre.
    const opensItsContent =
      next !== undefined &&
      next.kind !== 'fiche' &&
      axeOfUnit.get(next) === axe;
    const joins =
      previousAxe === axe
        ? previousIsSmall || unitIsSmall
        : previousIsSmall &&
          unitIsSmall &&
          previousAxe !== undefined &&
          !opensItsContent;
    if (!joins) {
      merged.push(unit);
      return;
    }
    const together = buildUnit(
      [...previous.lines, ...unit.lines],
      commonPath(previous.headingPath, unit.headingPath),
      previous.kind,
      { section: unit.section }
    );
    axeOfUnit.set(together, axe);
    merged[merged.length - 1] = together;
  });
  return merged;
};

// Le titre d'un axe ouvre une unité sans chemin : réunie à sa première
// section, elle en prend le chemin.
const commonPath = (a: string[], b: string[]): string[] => {
  if (a.length === 0 || b.length === 0) {
    return a.length === 0 ? b : a;
  }
  const length = a.findIndex((label, index) => label !== b[index]);
  return length === -1 ? a : a.slice(0, length);
};

/** Une unité trop longue est coupée entre deux lignes, avec une reprise. */
const windowUnits = (
  units: DocumentUnit[],
  { maxTokens, overlapTokens }: CutUnitsOptions
): DocumentUnit[] =>
  units.flatMap((unit) => {
    if (unit.tokenEstimate <= maxTokens) {
      return [unit];
    }
    const windows: DocumentUnit[] = [];
    let lines: UnitLine[] = [];
    let tokens = 0;
    for (const line of unit.lines) {
      const lineTokens = estimateTokenCount(line.text) + 1;
      if (lines.length > 0 && tokens + lineTokens > maxTokens) {
        windows.push(
          buildUnit(lines, unit.headingPath, unit.kind, {
            continued: windows.length > 0,
            section: unit.section,
            title: unit.title,
          })
        );
        const overlap = tailByTokens(lines, overlapTokens);
        lines = [...overlap];
        tokens = overlap.reduce(
          (sum, l) => sum + estimateTokenCount(l.text) + 1,
          0
        );
      }
      lines.push(line);
      tokens += lineTokens;
    }
    if (lines.length > 0) {
      windows.push(
        buildUnit(lines, unit.headingPath, unit.kind, {
          continued: windows.length > 0,
          section: unit.section,
          title: unit.title,
        })
      );
    }
    return windows;
  });

const tailByTokens = (lines: UnitLine[], maxTokens: number): UnitLine[] => {
  const tail: UnitLine[] = [];
  let tokens = 0;
  for (let index = lines.length - 1; index >= 0; index--) {
    tokens += estimateTokenCount(lines[index].text) + 1;
    if (tokens > maxTokens) break;
    tail.unshift(lines[index]);
  }
  return tail;
};
