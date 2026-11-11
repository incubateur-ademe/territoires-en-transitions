import { failure, Result, success } from '@tet/backend/utils/result.type';
import { type AnyNode, type Element } from 'domhandler';
import { DomUtils, parseDocument } from 'htmlparser2';
import JSZip from 'jszip';
import { posix } from 'node:path';

const SHEET_TERRITOIRE = 'Territoire';
/** Première ligne du bloc ① « Sélection des EPCI ». */
const FIRST_ROW = 7;
/** Colonne du libellé choisi (liste déroulante). */
const SELECTION_COLUMN = 'A';
/**
 * Liste de référence masquée, de la ligne 7 à la première cellule de code
 * vide : code et libellé désambiguïsé. Colonnes `HC` et `HL` de
 * `_build_caract_territoire` dans `snbc3`, en dur comme dans son
 * `api/excel_export.py`.
 */
const LIST_CODE_COLUMN = 'X';
const LIST_LIBELLE_COLUMN = 'Z';

export type SelectTerritoireInSnbc3WorkbookError =
  | 'WORKBOOK_INVALID'
  | 'TERRITOIRE_NOT_IN_WORKBOOK';

/**
 * Ouvre le classeur standalone SNBC 3 sur un territoire : son libellé en A7,
 * le reste de la sélection vidé, recalcul forcé à l'ouverture (lot 5 du plan
 * SNBC 3, ADR 0023 §3).
 *
 * Le XML est lu avec un parseur, puis patché en place : seules les cellules
 * A7 à AN de l'onglet `Territoire` et `<calcPr>` changent, le reste est
 * conservé octet pour octet. `exceljs` n'a pas de modèle des graphiques, et
 * échoue au chargement de ce classeur.
 *
 * @param codeTerritoire SIREN de l'EPCI ou de l'EPT, code commune pour Paris
 *   (cf. `getSnbc3CodeTerritoire`).
 */
export async function selectTerritoireInSnbc3Workbook(
  content: Buffer,
  codeTerritoire: string
): Promise<Result<Buffer, SelectTerritoireInSnbc3WorkbookError>> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(content);
  } catch {
    return failure('WORKBOOK_INVALID');
  }
  const readXml = async (path: string) => {
    const source = await zip.file(path)?.async('string');
    return source === undefined ? null : parseXml(source);
  };

  const workbook = await readXml('xl/workbook.xml');
  const rels = await readXml('xl/_rels/workbook.xml.rels');
  const sheetPath =
    workbook && rels && findSheetPath(workbook, rels, SHEET_TERRITOIRE);
  const sheet = sheetPath && (await readXml(sheetPath));
  const calcPr = workbook && findElement(workbook.root, 'calcPr');
  if (!workbook || !rels || !sheetPath || !sheet || !calcPr) {
    return failure('WORKBOOK_INVALID');
  }

  const sharedStringsPath = findRelationshipTarget(rels, (rel) =>
    rel.attribs.Type?.endsWith('/sharedStrings')
  );
  const sharedStrings = sharedStringsPath
    ? await readXml(sharedStringsPath)
    : null;
  const strings = sharedStrings
    ? DomUtils.getElementsByTagName('si', sharedStrings.root).map(
        DomUtils.textContent
      )
    : [];

  const cells = new Map(
    DomUtils.getElementsByTagName('c', sheet.root)
      .filter((cell) =>
        [SELECTION_COLUMN, LIST_CODE_COLUMN, LIST_LIBELLE_COLUMN].includes(
          cell.attribs.r?.replace(/\d+$/, '')
        )
      )
      .map((cell) => [cell.attribs.r, cell])
  );
  const read = (column: string, row: number) =>
    cellText(cells.get(`${column}${row}`), strings);

  // dernière ligne de la liste : la sélection est vidée jusque-là
  let lastRow = FIRST_ROW - 1;
  while (read(LIST_CODE_COLUMN, lastRow + 1)) {
    lastRow++;
  }
  if (lastRow < FIRST_ROW || !cells.has(`${SELECTION_COLUMN}${FIRST_ROW}`)) {
    return failure('WORKBOOK_INVALID');
  }

  const code = normalizeCode(codeTerritoire);
  let libelle: string | null = null;
  for (let row = FIRST_ROW; !libelle && row <= lastRow; row++) {
    if (normalizeCode(read(LIST_CODE_COLUMN, row) ?? '') === code) {
      libelle = read(LIST_LIBELLE_COLUMN, row);
    }
  }
  if (!libelle) {
    return failure('TERRITOIRE_NOT_IN_WORKBOOK');
  }

  // sans entrées de dossier (`xl/`…), que le classeur d'origine n'a pas
  const options = { createFolders: false };
  zip.file(
    sheetPath,
    applyPatches(sheet.source, writeSelection(cells, libelle, lastRow)),
    options
  );
  if (calcPr.attribs.fullCalcOnLoad !== '1') {
    zip.file(
      'xl/workbook.xml',
      applyPatches(workbook.source, [
        {
          range: range(calcPr),
          xml: emptyTag(calcPr.name, {
            ...calcPr.attribs,
            fullCalcOnLoad: '1',
          }),
        },
      ]),
      options
    );
  }

  return success(
    await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  );
}

type Xml = { source: string; root: AnyNode[] };

function parseXml(source: string): Xml {
  return {
    source,
    root: parseDocument(source, {
      xmlMode: true,
      withStartIndices: true,
      withEndIndices: true,
    }).children,
  };
}

function findElement(
  nodes: AnyNode[],
  name: string,
  predicate: (element: Element) => boolean = () => true
): Element | null {
  return DomUtils.findOne(
    (element) => element.name === name && predicate(element),
    nodes
  );
}

/** Premier enfant direct `name`. */
const child = (element: Element | null | undefined, name: string) =>
  element
    ? DomUtils.findOne((node) => node.name === name, element.children, false)
    : null;

/** Position d'un nœud dans le source : `[début, fin[`. */
const range = (node: AnyNode): [number, number] => [
  node.startIndex ?? 0,
  (node.endIndex ?? 0) + 1,
];

/** Texte d'une cellule : chaîne inline, partagée, ou valeur. */
function cellText(
  cell: Element | undefined,
  sharedStrings: string[]
): string | null {
  const is = child(cell, 'is');
  if (is) return DomUtils.textContent(is);
  const v = child(cell, 'v');
  if (!v) return null;
  const value = DomUtils.textContent(v);
  return cell?.attribs.t === 's' ? sharedStrings[Number(value)] ?? null : value;
}

/** Codes stockés en nombre ou en texte : comparaison sur l'entier quand c'en est un. */
function normalizeCode(code: string): string {
  const trimmed = code.trim();
  const n = Number(trimmed);
  return trimmed && Number.isSafeInteger(n) ? String(n) : trimmed;
}

type Patch = { range: [number, number]; xml: string };

/**
 * Libellé du territoire en A7, en chaîne inline (sans toucher à
 * `sharedStrings.xml`), et A8 à la dernière ligne de la liste vidés : la
 * cellule garde son style, pas sa valeur. Patches dans l'ordre du source.
 */
function writeSelection(
  cells: Map<string, Element>,
  libelle: string,
  lastRow: number
): Patch[] {
  const patches: Patch[] = [];
  for (let row = FIRST_ROW; row <= lastRow; row++) {
    const cell = cells.get(`${SELECTION_COLUMN}${row}`);
    if (!cell || (row > FIRST_ROW && !cell.children.length)) continue;
    const { r, s } = cell.attribs;
    const attributes: Record<string, string> = { r, ...(s && { s }) };
    patches.push({
      range: range(cell),
      xml:
        row === FIRST_ROW
          ? `<c${serializeAttributes({
              ...attributes,
              t: 'inlineStr',
            })}><is><t xml:space="preserve">${escapeXml(libelle)}</t></is></c>`
          : emptyTag('c', attributes),
    });
  }
  return patches;
}

/** Applique des patches donnés dans l'ordre du source. */
function applyPatches(source: string, patches: Patch[]): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const {
    range: [start, end],
    xml,
  } of patches) {
    parts.push(source.slice(cursor, start), xml);
    cursor = end;
  }
  parts.push(source.slice(cursor));
  return parts.join('');
}

/** Chemin dans le zip de la feuille `name`, d'après le classeur et ses relations. */
function findSheetPath(workbook: Xml, rels: Xml, name: string): string | null {
  const relationshipId = findElement(
    workbook.root,
    'sheet',
    (sheet) => sheet.attribs.name === name
  )?.attribs['r:id'];
  return relationshipId
    ? findRelationshipTarget(rels, (rel) => rel.attribs.Id === relationshipId)
    : null;
}

/** Cible d'une relation du classeur, relative à `xl/` ou absolue. */
function findRelationshipTarget(
  rels: Xml,
  predicate: (rel: Element) => boolean | undefined
): string | null {
  const target = findElement(
    rels.root,
    'Relationship',
    (rel) => !!predicate(rel)
  )?.attribs.Target;
  if (!target) return null;
  return target.startsWith('/')
    ? target.slice(1)
    : posix.normalize(posix.join('xl', target));
}

function emptyTag(name: string, attributes: Record<string, string>): string {
  return `<${name}${serializeAttributes(attributes)}/>`;
}

function serializeAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${escapeXml(value)}"`)
    .join('');
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
