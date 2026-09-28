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

type StackEntry = { level: number; label: string; number: string | null };

type OpenUnit = {
  lines: UnitLine[];
  headingPath: string[];
  kind: UnitKind;
  section?: string;
  title?: string;
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
  const units: DocumentUnit[] = [];
  const stack: StackEntry[] = [];
  let section: string | undefined;
  let open: OpenUnit = { lines: [], headingPath: [], kind: 'unknown' };
  let labelsInWindow: number[] = [];

  const close = () => {
    if (open.lines.some((line) => line.text.trim().length > 0)) {
      units.push(
        buildUnit(open.lines, open.headingPath, open.kind, {
          section: open.section,
          title: open.title,
        })
      );
    }
  };
  const start = (kind: UnitKind, lines: UnitLine[] = [], title?: string) => {
    open = { lines, headingPath: pathOf(stack), kind, section, title };
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
      const unitLine: UnitLine = { text: line.text, pageIndex: page.index };
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
      if (heading && heading.level >= FICHE_LEVEL) {
        close();
        popTo(stack, FICHE_LEVEL);
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

  return windowUnits(mergeSmallUnits(units, options.minTokens), options);

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
 * Une fiche reste seule : elle ne prend ni le sommaire qui la précède, ni
 * l'introduction de l'axe suivant ; les extraits sont de toute façon
 * regroupés par appel à la structuration.
 */
const mergeSmallUnits = (
  units: DocumentUnit[],
  minTokens: number
): DocumentUnit[] => {
  const merged: DocumentUnit[] = [];
  for (const unit of units) {
    const previous = merged.at(-1);
    if (
      previous &&
      (previous.tokenEstimate < minTokens || unit.tokenEstimate < minTokens) &&
      previous.section === unit.section &&
      previous.kind !== 'fiche' &&
      unit.kind !== 'fiche'
    ) {
      merged[merged.length - 1] = buildUnit(
        [...previous.lines, ...unit.lines],
        unit.headingPath,
        previous.kind,
        { section: unit.section }
      );
    } else {
      merged.push(unit);
    }
  }
  return merged;
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
