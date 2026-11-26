import { sumBy } from 'es-toolkit';
import type {
  ActionLevel,
  ActionLevelDoubt,
} from '../../models/import-question';
import { DocumentPage, PageLine } from '../document/document-page';
import {
  FICHE_LEVEL,
  HEADING_CONFIDENCE_THRESHOLD,
  HeadingMatch,
  isFicheLabel,
  isTitleField,
  matchExplicitHeading,
  matchHeading,
  SECTION_LEVEL,
} from './heading-patterns';

export type DetectedHeading = {
  pageIndex: number;
  lineIndex: number;
  /** Dernière ligne du titre, qui peut courir sur plusieurs lignes. */
  lastLineIndex: number;
  isLarge: boolean;
  match: HeadingMatch;
};

// Un titre est « grand » à partir de 15 % au-dessus de la taille du corps.
const LARGE_FONT_RATIO = 1.15;
// En dessous de 80 % du corps : logos, mentions, légendes, jamais des titres.
const SMALL_FONT_RATIO = 0.8;
const SAME_FONT_TOLERANCE = 0.5;
// Un titre en grande police court souvent sur plusieurs lignes, jusqu'à un mot
// par ligne sur une page de garde d'axe.
const MAX_CONTINUATION_LINES = 4;
const MAX_JOINED_LENGTH = 120;
// « ACTION 2 - ACCOMPAGNER LES PROJETS … » ou « OBJECTIF 2 - … » annonce son
// niveau sans ambiguïté : sa suite peut être plus longue, et d'une autre
// grande police. Quatre lignes de titre, libellé « Action 38 : » compris, vont
// jusqu'à 240 caractères.
const MAX_JOINED_EXPLICIT_LENGTH = 250;
// Un titre qui passe à la ligne garde l'interligne de son texte (1,15 à 1,4
// fois la police) : au-delà, la ligne du dessous ouvre un autre bloc ; en
// deçà, deux colonnes s'entrelacent.
const MIN_WRAPPED_LINE_GAP_RATIO = 1;
const MAX_WRAPPED_LINE_GAP_RATIO = 1.5;
// Une page qui aligne des lignes « 2.1.3 Titre » presque sans texte entre
// elles est un tableau récapitulatif : ce sont des lignes de tableau, pas des
// fiches. Un plan compact donne au moins deux lignes de texte par action.
const SUMMARY_MIN_ROWS = 4;
const SUMMARY_MAX_LINES_PER_ROW = 2.5;
// Après un intertitre, la fiche suivante ou le bandeau de son objectif.
const SOUS_AXE_LEVEL = 2;
// Deux morceaux d'une même ligne physique, côte à côte en deux colonnes.
const SAME_ROW_TOLERANCE = 0.5;
// Les numéros de fiches se suivent : un saut plus grand trahit un numéro de
// page ou un chiffre clé en grand.
const MAX_NUMBER_GAP = 3;
const MAX_PREFIX_LINES = 2;
const MAX_PREFIX_LENGTH = 80;
// « Fiche Action n°1.1 » seul sur sa ligne : le titre est dessous.
const MAX_TITLE_BELOW_LINES = 3;
const BULLET = /^(?:[o•●▪◦■□*\-–—]|\d{1,2}[.)])\s/u;
// La puce d'une énumération : « 1. … » est un titre numéroté, pas un élément.
const SYMBOL_BULLET = /^[o•●▪◦■□*\-–—]\s/u;
// En dessous, « Action 1 » et « Fiche action 1 » sont deux façons de titrer
// une fiche, pas deux niveaux.
const MIN_NAMED_FICHES = 3;
const MARKDOWN_MARK = /^#{1,4}\s+/u;
// « Fiche action n°1.2 », ou « Titre de l'action 1.2 » dans un cartouche.
const NAMED_FICHE = /^(?:fiche|(?:titre|intitul[ée]|nom)\s+d)/iu;
// Le choix entre fiche et étape ne se pose que si un quart des fiches au
// moins détaillent plusieurs étapes titrées : 7 sur 16 dans un PLPDMA réel,
// les autres fiches tenant en un seul bloc.
const MIN_STEPS_PER_FICHE = 2;
const DETAILED_FICHES_SHARE = 0.25;
// Plus de pilotes que de fiches : le document les donne étape par étape.
const PILOTES_PER_ETAPE_RATIO = 1.5;
const PILOTE_LABEL =
  /^(?:pilotes?|porteur|structure porteuse|porteurs? de l['’]action|ma[iî]tr(?:e|ise) d['’]ouvrage)/iu;
// « A – Organiser… », « B. Soutenir… » : l'élément d'une énumération lettrée.
const LETTERED_ITEM = /^([A-Z])\s*[.)\-–—]\s+(?=\p{Lu})/u;
// En moyenne, plus d'un élément et demi à cartouche par titre qui les porte.
const MIN_CARTOUCHES_PER_ENUMERATION = 1.5;
// « Fiche action n°1 », « Action 2 » : un titre qui se dit lui-même l'action.
const NAMES_ITSELF_ACTION = /^(?:fiche|action)(?!\p{L})/iu;

export type DetectHeadingsOptions = {
  /**
   * `fiche` (par défaut) : « Fiche action n°1.2 » est la fiche, ses
   * « Action 1 – … » restent dans son texte. `etape` : chaque « Action 1 – … »
   * est une fiche, et la fiche qui les porte devient un sous-axe ; une fiche
   * sans étape reste une fiche.
   */
  actionLevel?: ActionLevel;
};

export const detectHeadings = (
  pages: DocumentPage[],
  { actionLevel = 'fiche' }: DetectHeadingsOptions = {}
): DetectedHeading[] => {
  const { detected, isLargeLine } = scanHeadings(pages);
  const named = classifyNamedFicheActions(detected, pages);
  const byEtape = actionLevel === 'etape' && named.nested.size > 0;
  const kept = detected.filter(
    (heading) =>
      !named.dropped.has(heading) || (byEtape && named.nested.has(heading))
  );

  const headings = attachNumberPrefixes(
    keepNumberSequence(
      dropIntertitleSections(
        demoteCapitalsBelowExplicitAxes(
          dropSummaryRows(
            demoteBannersAboveFiches(
              addThemesAboveFiches(addEnumeratedActions(kept, pages), pages)
            ),
            pages
          )
        ),
        pages
      )
    ),
    pages,
    isLargeLine
  );
  return byEtape
    ? demoteToSousAxe(headings, [...named.stepsByFiche.keys()])
    : headings;
};

/**
 * Le doute que tranche aujourd'hui la lecture par défaut : un document dont la
 * plupart des fiches nommées (« Fiche action n°1.2 ») détaillent plusieurs
 * étapes titrées « Action 1 – … ». Selon la collectivité, l'action suivie est
 * la fiche ou l'étape. `null` quand le document ne laisse pas ce choix.
 */
export const detectActionLevelDoubt = (
  pages: DocumentPage[]
): ActionLevelDoubt | null => {
  const { detected } = scanHeadings(pages);
  const named = classifyNamedFicheActions(detected, pages);
  const detailed = named.fiches.filter(
    (fiche) =>
      (named.stepsByFiche.get(fiche)?.length ?? 0) >= MIN_STEPS_PER_FICHE
  );
  if (
    named.fiches.length < MIN_NAMED_FICHES ||
    detailed.length <
      Math.max(MIN_NAMED_FICHES, named.fiches.length * DETAILED_FICHES_SHARE)
  ) {
    return null;
  }
  const firstEtape = named.stepsByFiche.get(detailed[0])?.[0];
  if (!firstEtape) {
    return null;
  }
  const axes = uniqueByLabel(
    detected.filter((heading) => isExplicit(heading.match, 'axe'))
  );
  // L'axe de la fiche montrée en exemple : son numéro préfixe celui de la
  // fiche (« 1.2 » est dans l'axe 1), même titré seulement au récapitulatif.
  const axeNumber = detailed[0].match.number?.match(/^(\d{1,2})\./u)?.[1];
  const titledAxes = detected.filter(
    ({ match }) => isExplicit(match, 'axe') && match.title !== ''
  );
  const exampleAxe =
    titledAxes.find(({ match }) => match.number === axeNumber) ??
    axes.find(({ match }) => match.number === axeNumber) ??
    titledAxes[0] ??
    axes[0];
  return {
    kind: 'action-level',
    axes: exampleAxe ? describeLevel(exampleAxe, axes.length) : null,
    fiches: describeLevel(detailed[0], named.fiches.length),
    fichesWithEtapes: named.stepsByFiche.size,
    etapes: describeLevel(firstEtape, named.nested.size),
    proposed:
      countPiloteLabels(pages) > named.fiches.length * PILOTES_PER_ETAPE_RATIO
        ? 'etape'
        : 'fiche',
  };
};

const describeLevel = (heading: DetectedHeading, count: number) => ({
  exampleTitle:
    heading.match.title ||
    [heading.match.kind === 'axe' ? 'Axe' : '', heading.match.number]
      .filter(Boolean)
      .join(' '),
  examplePage: heading.pageIndex + 1,
  count,
});

const uniqueByLabel = (headings: DetectedHeading[]): DetectedHeading[] => {
  const seen = new Set<string>();
  return headings.filter(({ match }) => {
    const key = match.number ?? match.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Les pilotes et porteurs donnés dans le document, un par action suivie. */
const countPiloteLabels = (pages: DocumentPage[]): number =>
  pages
    .flatMap((page) => page.lines)
    .filter((line) => {
      const label = line.text
        .trim()
        .replace(MARKDOWN_MARK, '')
        .split(/[:：]/u)[0];
      return isFicheLabel(label) && PILOTE_LABEL.test(label.trim());
    }).length;

const scanHeadings = (
  pages: DocumentPage[]
): {
  detected: DetectedHeading[];
  isLargeLine: (line: PageLine) => boolean;
} => {
  const bodyFontSize = estimateBodyFontSize(pages);
  const sizeOf = (line: PageLine) =>
    bodyFontSize === null || line.fontSize === undefined
      ? 'body'
      : line.fontSize >= bodyFontSize * LARGE_FONT_RATIO
      ? 'large'
      : line.fontSize < bodyFontSize * SMALL_FONT_RATIO
      ? 'small'
      : 'body';

  const detected = pages.flatMap((page) => {
    const headings: DetectedHeading[] = [];
    let skipUntil = -1;
    page.lines.forEach((line, lineIndex) => {
      const size = sizeOf(line);
      if (lineIndex <= skipUntil || size === 'small') {
        return;
      }
      const isLarge = size === 'large';
      const alone = accepted(matchHeading(line.text, { isLarge }));
      const explicit =
        alone !== null &&
        (isExplicit(alone, 'fiche') ||
          isExplicit(alone, 'orientation') ||
          isExplicit(alone, 'axe'));
      // Le titre coupé par une colonne collée (« … etAction 3.1 ») ne se
      // prolonge pas : la ligne du dessous mêle les deux colonnes.
      const endsLine =
        explicit &&
        alone !== null &&
        alone.title !== '' &&
        line.text.trim().endsWith(alone.title);
      const continuation =
        isLarge || endsLine
          ? continuationOf(page.lines, lineIndex, {
              explicit,
              endsLine,
              isLargeLine: (other) => sizeOf(other) === 'large',
            })
          : { lines: [], lastLineIndex: lineIndex };
      const continuationText = continuation.lines
        .map((l) => l.text.trim())
        .join(' ');
      const joined =
        continuation.lines.length === 0
          ? null
          : explicit && alone
          ? { ...alone, title: `${alone.title} ${continuationText}`.trim() }
          : accepted(
              matchHeading(`${line.text.trim()} ${continuationText}`, {
                isLarge,
              })
            );
      const found = joined ?? alone;
      if (!found) {
        return;
      }
      const headEnd = joined ? continuation.lastLineIndex : lineIndex;
      const below =
        isExplicit(found, 'fiche') && found.title === ''
          ? titleBelow(
              page.lines,
              headEnd,
              (other) => sizeOf(other) === 'large'
            )
          : null;
      const inCell = isTitleField(line.text)
        ? cellContinuation(page.lines, headEnd)
        : null;
      const match = below
        ? { ...found, title: below.title }
        : inCell
        ? { ...found, title: `${found.title} ${inCell.text}` }
        : found;
      const lastLineIndex =
        below?.lastLineIndex ?? inCell?.lastLineIndex ?? headEnd;
      skipUntil = lastLineIndex;
      headings.push({
        pageIndex: page.index,
        lineIndex,
        lastLineIndex,
        isLarge,
        match,
      });
    });
    return headings;
  });

  return { detected, isLargeLine: (line) => sizeOf(line) === 'large' };
};

const isExplicit = (match: HeadingMatch, kind: HeadingMatch['kind']) =>
  match.kind === kind && match.confidence === 1;

type NamedFicheActions = {
  /** « Fiche action n°1.2 » : les fiches qui se nomment. */
  fiches: DetectedHeading[];
  /** Les « Action N » que la lecture par défaut retire. */
  dropped: Set<DetectedHeading>;
  /** Parmi eux, les étapes d'une fiche, à l'exclusion des renvois. */
  nested: Set<DetectedHeading>;
  stepsByFiche: Map<DetectedHeading, DetectedHeading[]>;
};

/**
 * Un document qui titre ses fiches « Fiche action n°1.2 » écrit aussi
 * « Action 1 – … » dans chacune, et « Action 1.2 … » dans son tableau
 * récapitulatif : des étapes et des renvois, pas d'autres fiches. Une étape
 * suit sa fiche sans titre d'axe entre les deux, et son numéro n'est celui
 * d'aucune fiche : « Action 1.2 » du récapitulatif renvoie à la fiche 1.2.
 * Une fiche autonome mêlée aux fiches nommées, elle, prolonge leur
 * numérotation en rompant celle des étapes : « Action 4 » après les fiches 1,
 * 2 et 3 (ou après les étapes 1 et 2 de la fiche 3), « Action 1.4 » après
 * les fiches 1.1 à 1.3, est gardée.
 */
const classifyNamedFicheActions = (
  headings: DetectedHeading[],
  pages: DocumentPage[]
): NamedFicheActions => {
  const pageByIndex = new Map(pages.map((page) => [page.index, page]));
  const startsWith = (heading: DetectedHeading, pattern: RegExp) =>
    isExplicit(heading.match, 'fiche') &&
    pattern.test(
      pageByIndex
        .get(heading.pageIndex)
        ?.lines[heading.lineIndex]?.text.trim()
        .replace(MARKDOWN_MARK, '') ?? ''
    );
  const fiches = headings.filter((heading) => startsWith(heading, NAMED_FICHE));
  const empty: NamedFicheActions = {
    fiches,
    dropped: new Set(),
    nested: new Set(),
    stepsByFiche: new Map(),
  };
  if (fiches.length < MIN_NAMED_FICHES) {
    return empty;
  }
  const ficheNumbers = new Set(fiches.map(({ match }) => match.number));
  const stepsByFiche = new Map<DetectedHeading, DetectedHeading[]>();
  const dropped = new Set<DetectedHeading>();
  const nested = new Set<DetectedHeading>();
  let current: DetectedHeading | null = null;
  // Les suites des fiches (1, 2, 3… ou 1.1, 1.2…) et des étapes de la fiche
  // en cours, qui se suivent depuis « Action 1 ».
  let lastFiche: string | null = null;
  let lastStep: number | null = null;
  for (const heading of headings) {
    const number = heading.match.number;
    if (fiches.includes(heading)) {
      current = heading;
      lastFiche = number;
      lastStep = null;
    } else if (startsWith(heading, /^actions?(?!\p{L})/iu)) {
      const singular = startsWith(heading, /^action(?!\p{L})/iu);
      const step =
        number !== null && /^\d+$/u.test(number) ? Number(number) : null;
      const continuesSteps =
        step !== null &&
        (lastStep === null ? step === 1 : step === lastStep + 1);
      if (
        singular &&
        number !== null &&
        !continuesSteps &&
        !ficheNumbers.has(number) &&
        nextNumbers(lastFiche).includes(number)
      ) {
        // Une fiche autonome : gardée, et ses « Action » ne sont pas les
        // étapes de la fiche précédente.
        lastFiche = number;
        lastStep = null;
        current = null;
        continue;
      }
      if (singular && continuesSteps) {
        lastStep = step;
      }
      dropped.add(heading);
      // « Actions 1-2 x x » : une ligne du calendrier, pas une étape. Une
      // « Action 2 » qui suit « Action 1 » dans la fiche est une étape, même
      // quand une fiche porte aussi le numéro 2 ; hors de cette suite, c'est
      // un renvoi.
      if (
        current &&
        singular &&
        (continuesSteps || !ficheNumbers.has(heading.match.number))
      ) {
        nested.add(heading);
        stepsByFiche.set(current, [
          ...(stepsByFiche.get(current) ?? []),
          heading,
        ]);
      }
    } else if (
      // Un intertitre en majuscules dans la fiche ne la referme pas.
      ['axe', 'orientation', 'section'].includes(heading.match.kind)
    ) {
      current = null;
    }
  }
  return { fiches, dropped, nested, stepsByFiche };
};

/**
 * Le titre qui porte des actions (fiche lue à l'étape, titre d'une
 * énumération) devient leur sous-axe. Il garde sa nature : le numéro d'une
 * fiche dit encore son axe.
 */
const demoteToSousAxe = (
  headings: DetectedHeading[],
  carriers: DetectedHeading[]
): DetectedHeading[] => {
  const keyOf = ({ pageIndex, lineIndex }: DetectedHeading) =>
    `${pageIndex}:${lineIndex}`;
  const carrierKeys = new Set(carriers.map(keyOf));
  return headings.map((heading) =>
    carrierKeys.has(keyOf(heading))
      ? { ...heading, match: { ...heading.match, level: SOUS_AXE_LEVEL } }
      : heading
  );
};

/**
 * Des actions énumérées sous le titre qui les regroupe : « - … » sous un
 * intertitre, « A – … », « B – … » sous une mesure. Chaque élément ouvre une
 * fiche, et le titre qui les porte (avec ses rappels) devient leur sous-axe.
 * Une énumération n'est faite d'actions que si ses éléments portent, pour la
 * plupart, leur propre cartouche (porteur, partenaires), et que le document
 * en donne bien plus que de titres qui les regroupent : l'action est ce qui
 * porte son cartouche, une liste d'étapes ou d'objectifs ne l'a pas. Ou bien
 * le document ne titre aucune fiche, et la plupart des titres de ce niveau
 * s'ouvrent sur leur liste : c'est elle qui donne les actions. Jamais sous un
 * axe, ni quand les éléments annoncent les titres qui suivent.
 */
const addEnumeratedActions = (
  headings: DetectedHeading[],
  pages: DocumentPage[]
): DetectedHeading[] => {
  const enumerations = textUnderHeadings(headings, pages)
    .filter(({ parent }) => parent.match.level > SECTION_LEVEL)
    .map(({ parent, body }) => ({ parent, ...enumerationIn(body) }));

  const withCartouches = enumerations.filter(
    ({ items, carrying }) =>
      items.length > 0 && isMajority(carrying, items.length)
  );
  const byCartouche =
    sumBy(withCartouches, ({ carrying }) => carrying) >
    withCartouches.length * MIN_CARTOUCHES_PER_ENUMERATION;
  const namesNoFiche = !headings.some(({ match }) =>
    isExplicit(match, 'fiche')
  );
  const opensOnList = (level: number) => {
    const peers = enumerations.filter(
      ({ parent }) => parent.match.level === level
    );
    return isMajority(
      peers.filter(({ opensBody }) => opensBody).length,
      peers.length
    );
  };
  // « Fiche action n°1 » garde ses étapes pilotées : en faire des fiches, ce
  // serait lire le document à l'étape, ce que la lecture par défaut ne fait pas.
  const namesItselfAction = (heading: DetectedHeading) =>
    NAMES_ITSELF_ACTION.test(sourceTextOf(heading, pages));
  // Une orientation qui annonce ses fiches en puces : elles suivent, titrées.
  const titles = new Set(headings.map(({ match }) => sameTitle(match.title)));
  const announcesHeadings = ({ items }: (typeof enumerations)[number]) =>
    isMajority(
      items.filter(({ title }) => titles.has(sameTitle(title))).length,
      items.length
    );
  const kept = enumerations.filter(
    (enumeration) =>
      // Les puces d'un axe sont ses objectifs chiffrés, pas ses actions.
      enumeration.parent.match.kind !== 'axe' &&
      !announcesHeadings(enumeration) &&
      ((byCartouche &&
        withCartouches.includes(enumeration) &&
        !namesItselfAction(enumeration.parent)) ||
        (namesNoFiche &&
          enumeration.opensBody &&
          opensOnList(enumeration.parent.match.level)))
  );
  if (kept.length === 0) {
    return headings;
  }

  // Ses rappels dans tout le document, pas seulement ceux qui le suivent : la
  // ligne « 1.1 Développer des » d'un récapitulatif deviendrait une fiche.
  const parents = kept.map(({ parent }) => parent);
  const demoted = demoteToSousAxe(
    headings,
    headings.filter((heading) =>
      parents.some(
        (parent) => heading === parent || isRecallOf(parent, heading)
      )
    )
  );
  const actions: DetectedHeading[] = kept.flatMap(({ items }) =>
    items.map(({ letter, title, line }) => ({
      pageIndex: line.pageIndex,
      lineIndex: line.lineIndex,
      lastLineIndex: line.lineIndex,
      isLarge: false,
      match: {
        kind: 'fiche' as const,
        level: FICHE_LEVEL,
        number: letter,
        title,
        confidence: 1,
      },
    }))
  );
  return [...demoted, ...actions].sort(
    (a, b) => a.pageIndex - b.pageIndex || a.lineIndex - b.lineIndex
  );
};

type BodyLine = { pageIndex: number; lineIndex: number; text: string };

/** « Mesure 3 » répétée en haut de page : le même titre, pas un nouveau. */
const isRecallOf = (parent: DetectedHeading, heading: DetectedHeading) =>
  heading.match.number !== null &&
  heading.match.kind === parent.match.kind &&
  heading.match.number === parent.match.number;

/** Les lignes non vides sous chaque titre, celles sous ses rappels comprises. */
const textUnderHeadings = (
  headings: DetectedHeading[],
  pages: DocumentPage[]
): { parent: DetectedHeading; body: BodyLine[] }[] => {
  const lines: BodyLine[] = pages.flatMap((page) =>
    page.lines.map((line, lineIndex) => ({
      pageIndex: page.index,
      lineIndex,
      text: line.text.trim(),
    }))
  );
  const positionOf = new Map(
    lines.map(({ pageIndex, lineIndex }, position) => [
      `${pageIndex}:${lineIndex}`,
      position,
    ])
  );
  const at = (heading: DetectedHeading, lineIndex: number) =>
    positionOf.get(`${heading.pageIndex}:${lineIndex}`) ?? 0;
  const groups: { parent: DetectedHeading; body: BodyLine[] }[] = [];
  headings.forEach((heading, index) => {
    const next = headings[index + 1];
    const body = lines
      .slice(
        at(heading, heading.lastLineIndex) + 1,
        next ? at(next, next.lineIndex) : lines.length
      )
      .filter(({ text }) => text !== '');
    const group = groups.at(-1);
    if (group && isRecallOf(group.parent, heading)) {
      group.body.push(...body);
    } else {
      groups.push({ parent: heading, body });
    }
  });
  return groups;
};

/**
 * Les éléments d'une seule énumération (des puces, ou des lettres), ceux qui
 * portent un cartouche, et si elle ouvre le texte de son titre.
 */
const enumerationIn = (whole: BodyLine[]) => {
  // Une liste de puces s'arrête au libellé nu qui ouvre la suivante
  // (« Indicateurs : » puis ses puces, « Pilote : » puis sa valeur en puce).
  // Une énumération lettrée garde ses puces : elles détaillent l'élément.
  const bulleted =
    whole.map(({ text }) => itemOf(text)).find(Boolean)?.letter === null;
  const stop = bulleted
    ? whole.findIndex(
        ({ text }, index) =>
          isFicheLabel(text.replace(/^[^\p{L}]+/u, '')) &&
          itemOf(whole[index + 1]?.text ?? '')?.letter === null
      )
    : -1;
  const body = stop === -1 ? whole : whole.slice(0, stop);
  const starts = body.flatMap((line, index) => {
    const item = itemOf(line.text);
    return item ? [{ ...item, index, line }] : [];
  });
  const items = starts.filter(
    (item) => (item.letter === null) === (starts[0]?.letter === null)
  );
  const carrying = items.filter((item, rank) =>
    body
      .slice(item.index + 1, items[rank + 1]?.index ?? body.length)
      .some(({ text }) => opensCartouche(text))
  ).length;
  return { items, carrying, opensBody: items[0]?.index === 0 };
};

const itemOf = (text: string) => {
  const item = text.match(SYMBOL_BULLET) ?? text.match(LETTERED_ITEM);
  if (!item) {
    return null;
  }
  const title = text.slice(item[0].length).trim();
  // « - Pilote : Service patrimoine » : un champ du cartouche, en puce.
  return isFieldLine(title) ? null : { letter: item[1] ?? null, title };
};

const opensCartouche = (text: string): boolean => {
  const label = text.replace(/^[^\p{L}]+/u, '');
  // « partenaires, avec des ateliers… » : la suite d'une phrase, pas un champ.
  if (startsLowercase(label) && !isFieldLine(label)) {
    return false;
  }
  return PILOTE_LABEL.test(label) || /^partenaire/iu.test(label);
};

/** « Pilote : Service patrimoine », « Indicateurs : » : un champ de fiche. */
const isFieldLine = (text: string): boolean =>
  isFicheLabel(text.split(/[:：]/u)[0]);

const isMajority = (count: number, total: number): boolean => count * 2 > total;

const sameTitle = (title: string): string =>
  title.toLowerCase().replace(/\s+/gu, ' ').trim();

/** La ligne du titre telle qu'écrite, sans dièse. */
const sourceTextOf = (heading: DetectedHeading, pages: DocumentPage[]) =>
  pages
    .find((page) => page.index === heading.pageIndex)
    ?.lines[heading.lineIndex]?.text.trim()
    .replace(MARKDOWN_MARK, '') ?? '';

/** Les numéros qui suivent une fiche : « 3 » donne « 4 », « 1.3 » donne « 1.4 » et « 2.1 ». */
const nextNumbers = (last: string | null): string[] => {
  const parts = last?.split('.').map(Number) ?? [];
  if (parts.length === 0 || parts.some(Number.isNaN)) {
    return [];
  }
  const sibling = [...parts.slice(0, -1), parts[parts.length - 1] + 1];
  return parts.length === 1
    ? [sibling.join('.')]
    : [
        sibling.join('.'),
        [...parts.slice(0, -2), parts[parts.length - 2] + 1, 1].join('.'),
      ];
};

/**
 * Le titre d'une fiche annoncée seule sur sa ligne : la ligne du dessous, et
 * sa suite tant qu'elle reste dans la même grande police ou commence par une
 * minuscule. Une puce, un libellé de champ ou un autre titre l'arrête.
 */
const titleBelow = (
  lines: PageLine[],
  lineIndex: number,
  isLargeLine: (line: PageLine) => boolean
): { title: string; lastLineIndex: number } | null => {
  const parts: string[] = [];
  let lastLineIndex = lineIndex;
  let length = 0;
  for (
    let index = lineIndex + 1;
    index < lines.length && parts.length < MAX_CONTINUATION_LINES;
    index++
  ) {
    const line = lines[index];
    const text = line.text.trim().replace(MARKDOWN_MARK, '');
    const inTitleFont =
      isLargeLine(line) && hasSameFontSize(line, lines[lineIndex + 1]);
    // Au-delà de trois lignes, seule la police du titre le prolonge.
    const continues =
      parts.length === 0
        ? /^[\p{L}\p{N}«"“]/u.test(text)
        : inTitleFont ||
          (parts.length < MAX_TITLE_BELOW_LINES && startsLowercase(text));
    length += text.length + 1;
    if (
      !continues ||
      length > MAX_JOINED_EXPLICIT_LENGTH ||
      opensField(text) ||
      startsExplicitHeading(text)
    ) {
      break;
    }
    parts.push(text);
    lastLineIndex = index;
  }
  return parts.length > 0 ? { title: parts.join(' '), lastLineIndex } : null;
};

/**
 * La fin d'un titre de fiche donné dans son cartouche : la valeur passe à la
 * ligne dans sa cellule, et sa suite commence par une minuscule.
 */
const cellContinuation = (
  lines: PageLine[],
  lineIndex: number
): { text: string; lastLineIndex: number } | null => {
  const parts: string[] = [];
  let index = lineIndex + 1;
  while (
    index < lines.length &&
    parts.length < MAX_TITLE_BELOW_LINES &&
    startsLowercase(lines[index].text)
  ) {
    parts.push(lines[index].text.trim());
    index++;
  }
  return parts.length > 0
    ? { text: parts.join(' '), lastLineIndex: index - 1 }
    : null;
};

/**
 * « 1- AMELIORER LA PERFORMANCE DES BATIMENTS » répété en haut de chaque
 * fiche, juste au-dessus de « ACTION 2 - … » : c'est l'objectif qui regroupe
 * les fiches, pas une fiche.
 */
const demoteBannersAboveFiches = (
  headings: DetectedHeading[]
): DetectedHeading[] =>
  headings.map((heading, index) => {
    const next = headings[index + 1];
    const isBanner =
      heading.match.level >= FICHE_LEVEL &&
      !isExplicit(heading.match, 'fiche') &&
      next !== undefined &&
      next.pageIndex === heading.pageIndex &&
      next.lineIndex === heading.lastLineIndex + 1 &&
      isExplicit(next.match, 'fiche');
    return isBanner
      ? {
          ...heading,
          match: { ...heading.match, kind: 'orientation', level: 2 },
        }
      : heading;
  });

/**
 * « BIODECHETS (restes alimentaires et végétaux) » posé juste au-dessus de
 * « Action 1. … », dans la police du titre : le thème qui regroupe les
 * fiches, même en casse mixte ou en police à peine plus grande que le corps.
 * Il ne vaut que répété au-dessus de plusieurs fiches.
 */
const addThemesAboveFiches = (
  headings: DetectedHeading[],
  pages: DocumentPage[]
): DetectedHeading[] => {
  const pageByIndex = new Map(pages.map((page) => [page.index, page]));
  const headingAt = new Map(
    headings.map((heading) => [
      `${heading.pageIndex}:${heading.lineIndex}`,
      heading,
    ])
  );
  // La suite d'un titre sur plusieurs lignes, ou la ligne qui le suit
  // (« PREVENTION » sous « 2 SENSIBILISATION … DES EFFORTS DE ») : la fin du
  // titre, coupé par la mise en page, pas un thème.
  const tailOfHeading = new Set(
    headings.flatMap(({ pageIndex, lineIndex, lastLineIndex }) =>
      Array.from(
        { length: lastLineIndex - lineIndex + 1 },
        (_, offset) => `${pageIndex}:${lineIndex + offset + 1}`
      )
    )
  );
  const themes = new Map<DetectedHeading, DetectedHeading>();
  // Un thème déjà lu comme ligne en capitales prend le même niveau que ses
  // voisins en casse mixte : sinon l'un rangerait les autres sous lui.
  const replaced = new Set<DetectedHeading>();
  for (const fiche of headings) {
    const lines = pageByIndex.get(fiche.pageIndex)?.lines;
    const index = fiche.lineIndex - 1;
    const line = lines?.[index];
    const above = headingAt.get(`${fiche.pageIndex}:${index}`);
    if (
      !isExplicit(fiche.match, 'fiche') ||
      !lines ||
      !line ||
      (above !== undefined && above.match.kind !== 'majuscules') ||
      tailOfHeading.has(`${fiche.pageIndex}:${index}`)
    ) {
      continue;
    }
    const text = line.text.trim().replace(MARKDOWN_MARK, '');
    const ficheFont = lines[fiche.lineIndex].fontSize;
    if (
      THEME_START.test(text) &&
      text.length <= MAX_THEME_LENGTH &&
      !/[.:;]$/u.test(text) &&
      !opensField(text) &&
      (ficheFont === undefined ||
        line.fontSize === undefined ||
        line.fontSize >= ficheFont - SAME_FONT_TOLERANCE)
    ) {
      themes.set(fiche, {
        pageIndex: fiche.pageIndex,
        lineIndex: index,
        lastLineIndex: index,
        isLarge: fiche.isLarge,
        match: {
          kind: 'orientation',
          level: SOUS_AXE_LEVEL,
          number: null,
          title: text,
          confidence: 1,
        },
      });
      if (above) {
        replaced.add(above);
      }
    }
  }
  if (themes.size < MIN_THEMED_FICHES) {
    return headings;
  }
  return headings.flatMap((heading) => {
    if (replaced.has(heading)) {
      return [];
    }
    const theme = themes.get(heading);
    return theme ? [theme, heading] : [heading];
  });
};

// Un thème commence par un mot en capitales : « BIODECHETS (végétaux) ».
const THEME_START = /^\p{Lu}{3,}(?:[\s'’-]|$)/u;
const MAX_THEME_LENGTH = 100;
const MIN_THEMED_FICHES = 2;

/** Les lignes numérotées d'un tableau récapitulatif ne sont pas des titres. */
const dropSummaryRows = (
  headings: DetectedHeading[],
  pages: DocumentPage[]
): DetectedHeading[] => {
  const isNumberedRow = (heading: DetectedHeading) =>
    heading.match.kind === 'fiche' && !isExplicit(heading.match, 'fiche');
  const lineCountByPage = new Map(
    pages.map((page) => [page.index, page.lines.length])
  );
  const rowCountByPage = new Map<number, number>();
  headings.filter(isNumberedRow).forEach((row) => {
    rowCountByPage.set(
      row.pageIndex,
      (rowCountByPage.get(row.pageIndex) ?? 0) + 1
    );
  });
  const isSummaryPage = (pageIndex: number) => {
    const rows = rowCountByPage.get(pageIndex) ?? 0;
    return (
      rows >= SUMMARY_MIN_ROWS &&
      (lineCountByPage.get(pageIndex) ?? 0) <= rows * SUMMARY_MAX_LINES_PER_ROW
    );
  };
  return headings.filter(
    (heading) => !(isNumberedRow(heading) && isSummaryPage(heading.pageIndex))
  );
};

/**
 * Un document qui nomme ses axes (« AXE STRATEGIQUE 4 ») ne fait pas d'une
 * ligne en majuscules un axe : c'est un intertitre ou la fin d'un titre
 * coupée par la mise en page (« ENERGETIQUE DES BATIMENTS TERTIAIRES »).
 * Seule une ligne qui se dit axe (« AXE TRANSVERSAL ») le reste.
 */
const demoteCapitalsBelowExplicitAxes = (
  headings: DetectedHeading[]
): DetectedHeading[] => {
  const namesItsAxes = headings.some((heading) =>
    isExplicit(heading.match, 'axe')
  );
  return namesItsAxes
    ? headings.map((heading) =>
        heading.match.kind === 'majuscules' &&
        heading.match.level < 2 &&
        !/^axe\b/iu.test(heading.match.title)
          ? { ...heading, match: { ...heading.match, level: 2 } }
          : heading
      )
    : headings;
};

/**
 * « Suivi et évaluation » en corps de texte entre deux fiches (ou le bandeau
 * d'objectif de la suivante) : un intertitre de la fiche, pas une partie du
 * document. Sans taille de police connue (Word, OCR), ou après la dernière
 * fiche (« Annexes »), le titre reste une partie.
 */
const dropIntertitleSections = (
  headings: DetectedHeading[],
  pages: DocumentPage[]
): DetectedHeading[] => {
  const hasFontSize = (heading: DetectedHeading) =>
    pages.find((page) => page.index === heading.pageIndex)?.lines[
      heading.lineIndex
    ]?.fontSize !== undefined;
  return headings.filter((heading, index) => {
    const previous = headings[index - 1];
    const next = headings[index + 1];
    return !(
      heading.match.level === SECTION_LEVEL &&
      !heading.isLarge &&
      hasFontSize(heading) &&
      previous !== undefined &&
      previous.match.level >= FICHE_LEVEL &&
      heading.pageIndex - previous.pageIndex <= 1 &&
      next !== undefined &&
      next.match.level >= SOUS_AXE_LEVEL
    );
  });
};

const accepted = (match: HeadingMatch | null): HeadingMatch | null =>
  match && match.confidence >= HEADING_CONFIDENCE_THRESHOLD ? match : null;

/**
 * Les lignes suivantes de même grande police, sans rien de minuscule : la
 * suite du titre. Un titre explicite (fiche, objectif, axe) admet une suite
 * plus longue, dans une autre police tant qu'elle reste grande, mais jamais
 * un chiffre clé en encadré (« 2030 », « 400 000 € »). Le morceau de la
 * colonne voisine, posé sur la même ligne physique, est sauté.
 *
 * Un titre explicite qui finit sa ligne admet aussi sa phrase qui passe à la
 * ligne en casse de phrase (« Action 3 : … et évaluer » puis « l’efficacité
 * des actions… »), dans sa police et à son interligne, hors rangée de tableau.
 */
const continuationOf = (
  lines: PageLine[],
  lineIndex: number,
  {
    explicit,
    endsLine,
    isLargeLine,
  }: {
    explicit: boolean;
    endsLine: boolean;
    isLargeLine: (line: PageLine) => boolean;
  }
): { lines: PageLine[]; lastLineIndex: number } => {
  const first = lines[lineIndex];
  const isLarge = isLargeLine(first);
  const maxLength = explicit ? MAX_JOINED_EXPLICIT_LENGTH : MAX_JOINED_LENGTH;
  const continuation: PageLine[] = [];
  let lastLineIndex = lineIndex;
  let length = first.text.trim().length;
  // Une rangée de tableau mêle ses colonnes : la suite n'y est jamais sûre.
  let besideColumn = hasSameRowNeighbour(lines, lineIndex);
  for (
    let index = lineIndex + 1;
    index < lines.length && continuation.length < MAX_CONTINUATION_LINES;
    index++
  ) {
    const line = lines[index];
    const text = line.text.trim();
    if (isSameRow(lines[lastLineIndex], line)) {
      besideColumn = true;
      continue;
    }
    length += text.length + 1;
    const sameSize = hasSameFontSize(line, first);
    const sameFont = sameSize || (explicit && isLarge && isLargeLine(line));
    const capitals = hasNoLowercase(text);
    // Un titre explicite passe à la ligne dans sa police, à son interligne ;
    // en police du corps, sur une seule ligne, en minuscule ou en capitales.
    const wrapped =
      endsLine &&
      sameSize &&
      !besideColumn &&
      !hasSameRowNeighbour(lines, index) &&
      (isLarge ||
        (continuation.length === 0 && (capitals || startsLowercase(text)))) &&
      wrapsTo(lines[lastLineIndex], line, text) &&
      fitsWrap(
        lines[lastLineIndex].text.trim(),
        text,
        hasNoLowercase(first.text)
      );
    if (
      !sameFont ||
      length > maxLength ||
      !((isLarge && capitals) || wrapped) ||
      // « II. » ou « 3 » : le début du titre suivant, pas la suite de celui-ci.
      /^(?:[IVX]{1,4}|\d{1,2})[.)]?(?:\s|$)/u.test(text) ||
      // « ACTION 1- PILOTER » sous « 1- ASSURER LA GOUVERNANCE » : un autre titre.
      startsExplicitHeading(text) ||
      (explicit && isKeyFigure(text))
    ) {
      break;
    }
    continuation.push(line);
    lastLineIndex = index;
  }
  return { lines: continuation, lastLineIndex };
};

/** La ligne du dessous, à l'interligne, d'un texte qui ne s'est pas arrêté. */
const wrapsTo = (previous: PageLine, line: PageLine, text: string): boolean =>
  previous.y !== undefined &&
  line.y !== undefined &&
  line.fontSize !== undefined &&
  line.y - previous.y >= MIN_WRAPPED_LINE_GAP_RATIO * line.fontSize &&
  line.y - previous.y <= MAX_WRAPPED_LINE_GAP_RATIO * line.fontSize &&
  !/[.:;!?]$/u.test(previous.text.trim()) &&
  !/[:：]$/u.test(text) &&
  !MARKDOWN_MARK.test(text) &&
  !opensField(text);

const hasSameRowNeighbour = (lines: PageLine[], index: number): boolean =>
  [lines[index - 1], lines[index + 1]].some(
    (other) => other !== undefined && isSameRow(lines[index], other)
  );

// Une ligne qui finit sur un mot-outil appelle sa suite : « … tarification
// incitative en » puis « REOMI ».
const ENDS_WITH_FUNCTION_WORD =
  /(?:^|\s)(?:de|des|du|d['’]|la|le|les|l['’]|et|en|à|aux|au|pour|sur|dans|par|avec|vers|ou|entre)$/iu;

/**
 * `text` est-il la ligne où passe la phrase de `previous`, plutôt qu'un
 * chapeau, un intertitre ou un libellé dans la même police ? Une suite en
 * minuscule l'est. Une ligne en capitales sous un titre en casse de phrase
 * ne l'est que si la phrase appelle sa suite (« CONTEXTE ET ENJEUX », « MARS
 * 2025 » restent à part). Sinon, le premier mot de `text` ne doit pas avoir pu
 * tenir sur la ligne d'au-dessus : à défaut d'abscisses, une ligne plus longue
 * que `previous` et son premier mot réunis n'est pas un retour à la ligne.
 */
const fitsWrap = (
  previous: string,
  text: string,
  titleInCapitals: boolean
): boolean => {
  if (startsLowercase(text)) {
    return true;
  }
  if (
    hasNoLowercase(text) &&
    !titleInCapitals &&
    !ENDS_WITH_FUNCTION_WORD.test(previous)
  ) {
    return false;
  }
  const firstWord = text.split(/\s+/u)[0];
  return text.length < previous.length + 1 + firstWord.length;
};

/** Une puce, ou un libellé de champ (« ⚙Pilote : ») : un autre bloc commence. */
const opensField = (text: string): boolean =>
  BULLET.test(text) ||
  isFicheLabel(text.replace(/^[^\p{L}]+/u, '').split(/[:：]/u)[0]);

const hasSameFontSize = (a: PageLine, b: PageLine): boolean =>
  a.fontSize !== undefined &&
  b.fontSize !== undefined &&
  Math.abs(a.fontSize - b.fontSize) <= SAME_FONT_TOLERANCE;

const startsLowercase = (text: string): boolean => /^\p{Ll}/u.test(text.trim());

const isSameRow = (a: PageLine, b: PageLine): boolean =>
  a.y !== undefined &&
  b.y !== undefined &&
  Math.abs(a.y - b.y) <= SAME_ROW_TOLERANCE * (a.fontSize ?? 1);

const isKeyFigure = (text: string): boolean =>
  /^\d/u.test(text) || text.replace(/[^\p{L}]/gu, '').length < 3;

const startsExplicitHeading = (text: string): boolean =>
  matchExplicitHeading(text) !== null;

const hasNoLowercase = (text: string): boolean => {
  const letters = text.replace(/[^\p{L}]/gu, '');
  return letters.replace(/[^\p{Ll}]/gu, '').length <= letters.length * 0.2;
};

/** Écarte les numéros seuls qui ne prolongent pas la suite des précédents. */
const keepNumberSequence = (headings: DetectedHeading[]): DetectedHeading[] => {
  let last = 0;
  return headings.filter(({ match }) => {
    if (match.kind !== 'numero') {
      return true;
    }
    const number = Number(match.number);
    if (number === 1 || (number > last && number <= last + MAX_NUMBER_GAP)) {
      last = number;
      return true;
    }
    return false;
  });
};

/**
 * « ANCRER L'ADMINISTRATION » puis « 1 DANS L'ÉCO-RESPONSABILITÉ » : les
 * lignes en grande police et en majuscules juste au-dessus du numéro sont le
 * début du titre de la fiche.
 */
const attachNumberPrefixes = (
  headings: DetectedHeading[],
  pages: DocumentPage[],
  isLargeLine: (line: PageLine) => boolean
): DetectedHeading[] => {
  const pageByIndex = new Map(pages.map((page) => [page.index, page]));
  const headingAt = new Map(
    headings.map((heading) => [
      `${heading.pageIndex}:${heading.lineIndex}`,
      heading,
    ])
  );
  const absorbed = new Set<DetectedHeading>();
  const attached = headings.map((heading) => {
    const lines = pageByIndex.get(heading.pageIndex)?.lines;
    if (heading.match.kind !== 'numero' || !lines) {
      return heading;
    }
    let firstLine = heading.lineIndex;
    for (
      let index = heading.lineIndex - 1;
      index >= 0 && heading.lineIndex - index <= MAX_PREFIX_LINES;
      index--
    ) {
      const line = lines[index];
      const other = headingAt.get(`${heading.pageIndex}:${index}`);
      if (
        !isLargeLine(line) ||
        !hasNoLowercase(line.text) ||
        line.text.trim().length > MAX_PREFIX_LENGTH ||
        (other !== undefined && other.match.kind !== 'majuscules') ||
        (index < firstLine - 1 &&
          Math.abs((line.fontSize ?? 0) - (lines[firstLine].fontSize ?? 0)) >
            SAME_FONT_TOLERANCE)
      ) {
        break;
      }
      if (other) {
        absorbed.add(other);
      }
      firstLine = index;
    }
    if (firstLine === heading.lineIndex) {
      return heading;
    }
    const prefix = lines
      .slice(firstLine, heading.lineIndex)
      .map((line) => line.text.trim())
      .join(' ');
    return {
      ...heading,
      lineIndex: firstLine,
      match: { ...heading.match, title: `${prefix} ${heading.match.title}` },
    };
  });
  return attached.filter((heading) => !absorbed.has(heading));
};

/** Taille de police du corps : la médiane pondérée par la longueur des lignes. */
const estimateBodyFontSize = (pages: DocumentPage[]): number | null => {
  const weighted = pages
    .flatMap((page) => page.lines)
    .filter((line) => line.fontSize !== undefined)
    .map((line) => ({
      size: line.fontSize as number,
      weight: line.text.length,
    }))
    .sort((a, b) => a.size - b.size);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total === 0) {
    return null;
  }
  let cumulated = 0;
  for (const entry of weighted) {
    cumulated += entry.weight;
    if (cumulated >= total / 2) {
      return entry.size;
    }
  }
  return null;
};
