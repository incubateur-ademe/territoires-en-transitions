import { parse } from 'csv-parse/sync';
import { countBy, maxBy } from 'es-toolkit';
import { cleanText } from '../normalize-text/clean-text';
import { buildTextGrid, GridCellKind, SheetGrid } from './sheet-grid';

const DELIMITERS = [';', ',', '\t'] as const;
type Delimiter = (typeof DELIMITERS)[number];

/** Lignes lues pour reconnaître le séparateur. */
const SAMPLE_LINES = 50;

/** Le CSV en une grille sans nom d'onglet ni fusion. */
export const readCsvGrid = (buffer: Buffer): SheetGrid => {
  const text = decodeCsv(buffer);
  const delimiter = detectDelimiter(text);
  return buildTextGrid(
    '',
    parseRows(text, delimiter).map((row) =>
      row.map((value) => cleanText(value.replace(/\r\n?/g, '\n')).trim())
    ),
    csvKindOf
  );
};

// Un CSV exporté d'Excel sous Windows est en windows-1252 : décodé en UTF-8,
// ses accents deviendraient des caractères de remplacement.
export const decodeCsv = (buffer: Buffer): string => {
  try {
    return stripBom(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
};

const stripBom = (text: string): string =>
  text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

/**
 * Le séparateur qui découpe le plus de lignes en un même nombre de colonnes :
 * une virgule dans un texte ne revient pas avec la régularité du vrai séparateur.
 */
export const detectDelimiter = (text: string): Delimiter => {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .slice(0, SAMPLE_LINES);
  const scored = DELIMITERS.map((delimiter) => {
    const counts = lines
      .map((line) => countOutsideQuotes(line, delimiter))
      .filter((count) => count > 0);
    const { value, occurrences } = mostFrequent(counts);
    return { delimiter, occurrences, value };
  });
  const best = scored.reduce((best, candidate) =>
    candidate.occurrences > best.occurrences ||
    (candidate.occurrences === best.occurrences && candidate.value > best.value)
      ? candidate
      : best
  );
  return best.occurrences > 0 ? best.delimiter : ';';
};

const countOutsideQuotes = (line: string, delimiter: string): number => {
  let count = 0;
  let quoted = false;
  for (const character of line) {
    if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      count += 1;
    }
  }
  return count;
};

/** La valeur la plus fréquente ; à égalité, la plus grande. */
const mostFrequent = (
  values: number[]
): { value: number; occurrences: number } => {
  // maxBy garde le premier des ex aequo : la plus grande valeur d'abord.
  const byValue = Object.entries(countBy(values, String))
    .map(([value, occurrences]) => ({ value: Number(value), occurrences }))
    .sort((a, b) => b.value - a.value);
  return (
    maxBy(byValue, ({ occurrences }) => occurrences) ?? {
      value: 0,
      occurrences: 0,
    }
  );
};

const parseRows = (text: string, delimiter: Delimiter): string[][] => {
  try {
    return parse(text, {
      delimiter,
      relax_column_count: true,
      relax_quotes: true,
      skip_empty_lines: false,
    }) as string[][];
  } catch {
    // Guillemet jamais refermé : mieux vaut des cellules approximatives
    // qu'un document refusé.
    return text.split(/\r?\n/).map((line) => line.split(delimiter));
  }
};

const NUMBER = /^[-+]?\d+(?:[.,]\d+)?$/;

const csvKindOf = (text: string): GridCellKind =>
  text === '' ? 'empty' : NUMBER.test(text) ? 'number' : 'text';
