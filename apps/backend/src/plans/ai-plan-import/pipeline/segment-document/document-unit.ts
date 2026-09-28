import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';

export type UnitKind = 'fiche' | 'section' | 'table' | 'unknown';

export type UnitLine = { text: string; pageIndex: number };

/**
 * Un morceau du document de la taille d'une fiche action, avec sa place dans
 * la hiérarchie et ses pages : ce que le modèle lit d'un coup.
 */
export type DocumentUnit = {
  id: string;
  lines: UnitLine[];
  text: string;
  pageStart: number;
  pageEnd: number;
  /** Titres de niveau axe et sous-axe qui couvrent l'unité. */
  headingPath: string[];
  /** Partie du document (diagnostic, plan d'actions, annexes…), si elle est titrée. */
  section?: string;
  /** Titre complet d'une fiche, même réparti sur plusieurs lignes du texte. */
  title?: string;
  kind: UnitKind;
  tokenEstimate: number;
  /** Fenêtre d'une unité trop longue, coupée arbitrairement. */
  continued?: boolean;
};

export const buildUnit = (
  lines: UnitLine[],
  headingPath: string[],
  kind: UnitKind,
  extra: { continued?: boolean; section?: string; title?: string } = {}
): DocumentUnit => {
  const text = lines.map((line) => line.text).join('\n');
  return {
    id: '',
    lines,
    text,
    pageStart: Math.min(...lines.map((line) => line.pageIndex)),
    pageEnd: Math.max(...lines.map((line) => line.pageIndex)),
    headingPath,
    kind,
    tokenEstimate: estimateTokenCount(text),
    ...(extra.section ? { section: extra.section } : {}),
    ...(extra.title ? { title: extra.title } : {}),
    ...(extra.continued ? { continued: true } : {}),
  };
};

/** Numérote les unités dans l'ordre du document : `u0001`, `u0001-2` pour une fenêtre. */
export const numberUnits = (units: DocumentUnit[]): DocumentUnit[] => {
  let ordinal = 0;
  let window = 0;
  return units.map((unit, index) => {
    const continuesPrevious = unit.continued && index > 0;
    if (continuesPrevious) {
      window += 1;
    } else {
      ordinal += 1;
      window = 1;
    }
    const base = `u${String(ordinal).padStart(4, '0')}`;
    return {
      ...unit,
      id:
        continuesPrevious || units[index + 1]?.continued
          ? `${base}-${window}`
          : base,
    };
  });
};
