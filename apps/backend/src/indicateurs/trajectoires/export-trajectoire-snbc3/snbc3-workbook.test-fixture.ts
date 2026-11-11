import { DomUtils, parseDocument } from 'htmlparser2';
import JSZip from 'jszip';

export type Snbc3WorkbookTerritoireFixture = {
  /** Nombre : cellule numérique ; chaîne : texte partagé. */
  code: string | number;
  /** Défaut : le libellé. */
  nom?: string;
  /** Libellé désambiguïsé, déjà échappé pour le XML. */
  libelle: string;
  /** Pré-rempli en A (première zone, hors EPT et Paris). */
  prefilled?: boolean;
};

/** Chemin de l'onglet `Territoire` dans le mini-classeur. */
export const SNBC3_WORKBOOK_FIXTURE_SHEET = 'xl/worksheets/sheet2.xml';

/**
 * Mini classeur standalone SNBC 3, à la structure de l'onglet `Territoire`
 * généré par `snbc3` (`_build_caract_territoire`) : sélection en A, formule en
 * B, liste masquée en X (code), Y (nom) et Z (libellé désambiguïsé). Un onglet
 * de plus et un « graphique » vérifient que le reste du zip ne change pas.
 */
export function buildSnbc3WorkbookFixture({
  territoires,
  calcPr = '<calcPr calcId="191029"/>',
  transformSheet = (xml) => xml,
}: {
  territoires: Snbc3WorkbookTerritoireFixture[];
  calcPr?: string;
  /** Variante de l'onglet `Territoire`, pour tester la lecture du XML. */
  transformSheet?: (xml: string) => string;
}): Promise<Buffer> {
  const lastRow = 6 + territoires.length;
  const sharedStrings: string[] = [];
  const shared = (s: string) => {
    if (!sharedStrings.includes(s)) sharedStrings.push(s);
    return sharedStrings.indexOf(s);
  };

  const rows = territoires
    .map((t, i) => {
      const r = 7 + i;
      const a = t.prefilled
        ? `<c r="A${r}" s="89" t="inlineStr"><is><t>${t.libelle}</t></is></c>`
        : `<c r="A${r}" s="89" t="n"/>`;
      const b = `<c r="B${r}"><f>IFERROR(INDEX($X$7:$X$${lastRow},MATCH($A${r},$Z$7:$Z$${lastRow},0)),"")</f><v/></c>`;
      // Code en texte : libellé en texte partagé aussi.
      const [x, z] =
        typeof t.code === 'number'
          ? [
              `<c r="X${r}" t="n"><v>${t.code}</v></c>`,
              `<c r="Z${r}" t="inlineStr"><is><t>${t.libelle}</t></is></c>`,
            ]
          : [
              `<c r="X${r}" t="s"><v>${shared(t.code)}</v></c>`,
              `<c r="Z${r}" t="s"><v>${shared(t.libelle)}</v></c>`,
            ];
      const y = `<c r="Y${r}" t="inlineStr"><is><t>${
        t.nom ?? t.libelle
      }</t></is></c>`;
      return `<row r="${r}">${a}${b}<c r="D${r}" t="inlineStr"><is><t>PIVOT_${r}</t></is></c>${x}${y}${z}</row>`;
    })
    .join('');

  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>'
  );
  zip.file(
    'xl/workbook.xml',
    `<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="TOUS SECTEURS" sheetId="1" r:id="rId1"/><sheet name="Territoire" sheetId="2" r:id="rId2"/></sheets><definedNames><definedName name="terr_num_epci">Territoire!$B$7:$B$${lastRow}</definedName></definedNames>${calcPr}</workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    // une cible absolue, une relative : les deux formes existent
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`
  );
  zip.file(
    'xl/sharedStrings.xml',
    `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${sharedStrings
      .map((s) => `<si><t>${s}</t></si>`)
      .join('')}</sst>`
  );
  zip.file(
    'xl/worksheets/sheet1.xml',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1"><f>CALCUL!K12</f><v>42</v></c></row></sheetData><drawing r:id="rId1"/></worksheet>'
  );
  zip.file(
    SNBC3_WORKBOOK_FIXTURE_SHEET,
    transformSheet(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="37"/></cols><sheetData><row r="3"><c r="A3" t="inlineStr"><is><t>Zone détectée</t></is></c><c r="B3"><f>IF($X$2&gt;0,"HEXAGONE","")</f><v/></c></row>${rows}</sheetData><dataValidations count="1"><dataValidation sqref="A7:A${lastRow}" type="list"><formula1>$Z$7:$Z$${lastRow}</formula1></dataValidation></dataValidations></worksheet>`)
  );
  zip.file('xl/charts/chart1.xml', '<c:chartSpace>graphique</c:chartSpace>');
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/** XML de l'onglet `Territoire` du mini-classeur. */
export async function readSheetFixture(workbook: Buffer): Promise<string> {
  return (
    (await (await JSZip.loadAsync(workbook))
      .file(SNBC3_WORKBOOK_FIXTURE_SHEET)
      ?.async('string')) ?? ''
  );
}

/** Cellule A d'une ligne de l'onglet `Territoire`, en XML. */
export function selectionCellFixture(
  sheetXml: string,
  row: number
): string | undefined {
  const cell = DomUtils.findOne(
    (element) => element.name === 'c' && element.attribs.r === `A${row}`,
    parseDocument(sheetXml, {
      xmlMode: true,
      withStartIndices: true,
      withEndIndices: true,
    }).children
  );
  return cell
    ? sheetXml.slice(cell.startIndex ?? 0, (cell.endIndex ?? 0) + 1)
    : undefined;
}

/** Cellule A d'une ligne de l'onglet `Territoire` du mini-classeur, en XML. */
export async function readSelectionCellFixture(
  workbook: Buffer,
  row: number
): Promise<string | undefined> {
  return selectionCellFixture(await readSheetFixture(workbook), row);
}
