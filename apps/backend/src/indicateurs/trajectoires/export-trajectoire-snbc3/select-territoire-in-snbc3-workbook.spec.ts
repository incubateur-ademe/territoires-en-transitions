import JSZip from 'jszip';
import { describe, expect, test } from 'vitest';
import {
  buildSnbc3WorkbookFixture,
  SNBC3_WORKBOOK_FIXTURE_SHEET,
  selectionCellFixture as cellA,
  Snbc3WorkbookTerritoireFixture,
  readSheetFixture,
} from './snbc3-workbook.test-fixture';
import { selectTerritoireInSnbc3Workbook } from './select-territoire-in-snbc3-workbook';

const TERRITOIRES: Snbc3WorkbookTerritoireFixture[] = [
  {
    code: 200000172,
    libelle: 'CC Faucigny - Glières',
    prefilled: true,
  },
  {
    code: 200000438,
    libelle: 'CC du Pays de Pontchâteau',
    prefilled: true,
  },
  {
    code: 247000623,
    nom: 'CC des Quatre Rivières',
    libelle: 'CC des Quatre Rivières (247000623)',
    prefilled: true,
  },
  {
    code: 247400666,
    nom: 'CC des Quatre Rivières',
    libelle: 'CC des Quatre Rivières (247400666)',
    prefilled: true,
  },
  // EPT : code et libellé en texte partagé, jamais pré-rempli
  { code: '200057875', libelle: 'Est Ensemble' },
  { code: 75056, libelle: 'Ville de Paris' },
  { code: 249740077, libelle: 'CA CIVIS &amp; co' },
];
const LAST_ROW = 6 + TERRITOIRES.length;

type FixtureOptions = Omit<
  Parameters<typeof buildSnbc3WorkbookFixture>[0],
  'territoires'
>;

const buildWorkbook = (options: FixtureOptions = {}) =>
  buildSnbc3WorkbookFixture({ territoires: TERRITOIRES, ...options });

async function select(code: string, options?: FixtureOptions) {
  const workbook = await buildWorkbook(options);
  const result = await selectTerritoireInSnbc3Workbook(workbook, code);
  if (!result.success) return { workbook, result, zip: null, sheet: '' };
  const zip = await JSZip.loadAsync(result.data);
  const sheet = await readSheetFixture(result.data);
  return { workbook, result, zip, sheet };
}

describe('selectTerritoireInSnbc3Workbook', () => {
  test('écrit le libellé en A7 et vide A8 à la fin de la liste, en gardant le style', async () => {
    const { result, sheet } = await select('200000438');
    expect(result.success).toBe(true);

    expect(cellA(sheet, 7)).toBe(
      '<c r="A7" s="89" t="inlineStr"><is><t xml:space="preserve">CC du Pays de Pontchâteau</t></is></c>'
    );
    for (let row = 8; row <= LAST_ROW; row++) {
      // les cellules déjà vides (`t="n"`) restent telles quelles
      expect(cellA(sheet, row)).toMatch(
        new RegExp(`^<c r="A${row}" s="89"( t="n")?/>$`)
      );
    }
  });

  test('ne touche ni aux formules de B, ni à la validation, ni aux autres colonnes', async () => {
    const { workbook, sheet } = await select('200000438');
    const original = await readSheetFixture(workbook);
    const withoutColumnA = (xml: string) =>
      xml.replace(/<c r="A(?:[7-9]|\d\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g, '');
    expect(withoutColumnA(sheet)).toBe(withoutColumnA(original));
  });

  test('trouve un code stocké en texte partagé (EPT, jamais pré-rempli)', async () => {
    const { sheet } = await select('200057875');
    expect(cellA(sheet, 7)).toBe(
      '<c r="A7" s="89" t="inlineStr"><is><t xml:space="preserve">Est Ensemble</t></is></c>'
    );
  });

  test('prend le libellé désambiguïsé en cas de doublon de nom', async () => {
    const { sheet } = await select('247400666');
    expect(cellA(sheet, 7)).toContain(
      '<t xml:space="preserve">CC des Quatre Rivières (247400666)</t>'
    );
  });

  test('sélectionne Paris par son code commune', async () => {
    const { sheet } = await select('75056');
    expect(cellA(sheet, 7)).toContain(
      '<t xml:space="preserve">Ville de Paris</t>'
    );
  });

  test('recopie le libellé tel quel, entités XML comprises', async () => {
    const { sheet } = await select('249740077');
    expect(cellA(sheet, 7)).toContain(
      '<t xml:space="preserve">CA CIVIS &amp; co</t>'
    );
  });

  test('renvoie une erreur pour un territoire absent du classeur', async () => {
    const { result } = await select('999999999');
    expect(result).toMatchObject({
      success: false,
      error: 'TERRITOIRE_NOT_IN_WORKBOOK',
    });
  });

  test('renvoie une erreur pour un fichier qui n’est pas un classeur', async () => {
    const result = await selectTerritoireInSnbc3Workbook(
      Buffer.from('pas un zip'),
      '200000172'
    );
    expect(result).toMatchObject({
      success: false,
      error: 'WORKBOOK_INVALID',
    });
  });

  test('lit le XML avec un parseur : commentaires et ordre des attributs sans effet', async () => {
    const { sheet } = await select('75056', {
      transformSheet: (xml) =>
        xml
          // une fausse cellule A7 dans un commentaire
          .replace(
            '<sheetData>',
            '<!-- <c r="A7" t="inlineStr"><is><t>leurre</t></is></c> --><sheetData>'
          )
          // attributs dans un autre ordre, `>` dans une valeur
          .replaceAll(
            /<c r="(A\d+)" s="89"/g,
            '<c s="89" x14ac:note="a>b" r="$1"'
          ),
    });
    expect(sheet).toContain(
      '<!-- <c r="A7" t="inlineStr"><is><t>leurre</t></is></c> -->'
    );
    expect(cellA(sheet, 7)).toBe(
      '<c r="A7" s="89" t="inlineStr"><is><t xml:space="preserve">Ville de Paris</t></is></c>'
    );
    expect(cellA(sheet, 8)).toBe('<c r="A8" s="89"/>');
  });

  test('renvoie une erreur sans liste de référence en X (colonnes déplacées)', async () => {
    const { result } = await select('200000172', {
      transformSheet: (xml) =>
        xml.replaceAll(/<c r="X\d+"[^>]*>[\s\S]*?<\/c>/g, ''),
    });
    expect(result).toMatchObject({
      success: false,
      error: 'WORKBOOK_INVALID',
    });
  });

  test('renvoie une erreur sans `<calcPr>` (le générateur le pose toujours)', async () => {
    const { result } = await select('200000172', { calcPr: '' });
    expect(result).toMatchObject({
      success: false,
      error: 'WORKBOOK_INVALID',
    });
  });

  test.each([
    [
      '<calcPr calcId="191029"/>',
      '<calcPr calcId="191029" fullCalcOnLoad="1"/>',
    ],
    [
      '<calcPr calcId="191029" fullCalcOnLoad="0"/>',
      '<calcPr calcId="191029" fullCalcOnLoad="1"/>',
    ],
    // déjà posé : `workbook.xml` inchangé
    [
      '<calcPr fullCalcOnLoad="1" calcId="191029" />',
      '<calcPr fullCalcOnLoad="1" calcId="191029" />',
    ],
  ])('force le recalcul à l’ouverture (%s)', async (calcPr, expected) => {
    const { zip } = await select('200000172', { calcPr });
    const workbook = await zip?.file('xl/workbook.xml')?.async('string');
    expect(workbook).toContain(expected);
  });

  test('laisse identiques les autres entrées du zip (graphiques compris)', async () => {
    const { workbook, zip } = await select('200000172');
    const original = await JSZip.loadAsync(workbook);
    const modified = [SNBC3_WORKBOOK_FIXTURE_SHEET, 'xl/workbook.xml'];

    expect(Object.keys(zip?.files ?? {})).toEqual(Object.keys(original.files));
    for (const name of Object.keys(original.files)) {
      if (modified.includes(name) || original.files[name].dir) continue;
      const before = await original.file(name)?.async('nodebuffer');
      const after = await zip?.file(name)?.async('nodebuffer');
      expect(before && after && Buffer.compare(before, after), name).toBe(0);
    }
  });
});
