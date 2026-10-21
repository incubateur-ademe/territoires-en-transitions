import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildHorizontalHierarchyWorkbook,
  buildTestWorkbook,
} from '../__fixtures__/build-test-workbook';
import { readWorkbookGrids } from '../analyze-workbook/read-workbook-grid';
import {
  buildTextGrid,
  renderGridLines,
  SheetGrid,
} from '../analyze-workbook/sheet-grid';
import { buildPage, DocumentPage } from '../document/document-page';
import { cutTabularUnits, hasMergedRowGroups } from './cut-tabular-units';

const pageOf = (grid: SheetGrid, index = 0): DocumentPage =>
  buildPage(
    index,
    renderGridLines(grid).map(({ text }) => ({ text })),
    grid.name ? { label: grid.name } : {}
  );

const textsOf = (unit: { lines: { text: string }[] }) =>
  unit.lines.map(({ text }) => text);

let workbook: SheetGrid[];
let suivi: SheetGrid;

beforeAll(async () => {
  const grids = await readWorkbookGrids(
    await buildHorizontalHierarchyWorkbook()
  );
  if (!grids.success) {
    throw new Error(grids.error.kind);
  }
  workbook = grids.data;
  suivi = workbook.find(({ name }) => name === 'Suivi') as SheetGrid;
});

describe('cutTabularUnits avec la grille', () => {
  it("répète dans chaque unité l'en-tête reconstitué sur deux rangées, pas le titre", () => {
    const units = cutTabularUnits(pageOf(suivi), 3_500, suivi);
    const header =
      "\tObjectifs stratégiques\tObjectifs opérationnels\tn°\tAxes opérationnels\tPropositions d'actions\tPILOTE\tCALENDRIER · 2021\tCALENDRIER · 2022\tCALENDRIER · 2023\tCALENDRIER · 2024\tAVANCEMENT\tCOMMENTAIRES\tSUIVI BUDGETAIRE · Budget prévisionnel\tSUIVI BUDGETAIRE · Part subventionnable";

    expect(units.length).toBeGreaterThan(1);
    expect(textsOf(units[0]).slice(0, 2)).toEqual([
      'TABLEAU DE SUIVI DE MISE EN OEUVRE',
      header,
    ]);
    for (const unit of units.slice(1)) {
      expect(unit.lines[0].text).toBe(header);
    }
  });

  it('coupe à chaque bandeau, qui situe les unités suivantes', () => {
    const units = cutTabularUnits(pageOf(suivi), 3_500, suivi);

    expect(units.map(({ headingPath }) => headingPath)).toEqual([
      ['Suivi', 'AMBITION n°1 : Pour un territoire sobre en énergie'],
      ['Suivi', 'AMBITION n°2 Pour un territoire préservé'],
    ]);
    expect(units[1].lines[1].text).toBe(
      '\tAMBITION n°2 Pour un territoire préservé'
    );
  });

  it('écrit une valeur fusionnée une seule fois, sur sa première rangée', () => {
    const [first] = cutTabularUnits(pageOf(suivi), 3_500, suivi);
    const lines = textsOf(first);

    expect(
      lines.filter((line) => line.includes('Se déplacer moins et mieux'))
    ).toHaveLength(1);
    expect(lines).toContain(
      '\t\t\t\t\t\tCalibrer les navettes vers le pôle sud\tX\tx\t\t\tEn projet'
    );
  });

  it('coupe entre deux fiches et rappelle les regroupements en cours', () => {
    const units = cutTabularUnits(pageOf(suivi), 200, suivi);
    const ficheUnit = units.find((unit) =>
      textsOf(unit).some((line) => line.includes('Communiquer sur les aides'))
    );

    expect(ficheUnit && textsOf(ficheUnit).slice(1, 3)).toEqual([
      "[Suite de : Se déplacer moins et mieux > Développer l'usage des transports collectifs]",
      '\t\t\t2\tInterco\tCommuniquer sur les aides à la mobilité\tLancer une campagne annuelle\t\t\t\tX\tNon engagée',
    ]);
    expect(ficheUnit?.continued).toBeUndefined();
    for (const unit of units) {
      const fiches = textsOf(unit).filter((line) =>
        /^\t[^\t]*\t[^\t]*\t\d+\t/.test(line)
      );
      expect(fiches.length).toBeLessThanOrEqual(2);
    }
  });

  it("ouvre la suite d'une fiche trop longue par son rappel", () => {
    const units = cutTabularUnits(pageOf(suivi), 90, suivi);
    const suite = units.find(
      (unit) =>
        unit.continued &&
        textsOf(unit).some((line) => line.includes('Calibrer les navettes'))
    );

    expect(suite && textsOf(suite)[1]).toBe(
      "[Suite de : Se déplacer moins et mieux > Développer l'usage des transports collectifs > 1 > Région / Interco > Aménager deux pôles multimodaux]"
    );
  });

  it('découpe une liste d’une colonne sans y voir de bandeaux', () => {
    const liste = workbook.find(({ name }) => name === 'Feuil2') as SheetGrid;

    expect(cutTabularUnits(pageOf(liste), 3_500, liste).map(textsOf)).toEqual([
      [
        'Avancement',
        'Non engagée',
        'En projet',
        'En cours',
        'Terminée',
        'Annulée',
      ],
    ]);
  });

  it('coupe un CSV plat au changement de la valeur répétée, ligne de titre isolée comprise', () => {
    const csv = buildTextGrid('', [
      ['Axe', 'Action', 'Pilote'],
      ['Axe 1 – Mobilité', '', ''],
      ['Mobilité', 'Covoiturer entre collègues', 'Interco'],
      ['Mobilité', 'Pédaler jusqu’à la gare', 'Commune'],
      ['Énergie', 'Isoler les écoles', 'Interco'],
      ['Énergie', 'Équiper les toits', 'Commune'],
    ]);

    const units = cutTabularUnits(pageOf(csv), 45, csv);

    expect(units.map((unit) => [unit.headingPath, textsOf(unit)])).toEqual([
      [
        ['Axe 1 – Mobilité'],
        [
          'Axe\tAction\tPilote',
          'Axe 1 – Mobilité',
          'Mobilité\tCovoiturer entre collègues\tInterco',
          'Mobilité\tPédaler jusqu’à la gare\tCommune',
        ],
      ],
      [
        ['Axe 1 – Mobilité'],
        [
          'Axe\tAction\tPilote',
          'Énergie\tIsoler les écoles\tInterco',
          'Énergie\tÉquiper les toits\tCommune',
        ],
      ],
    ]);
    expect(hasMergedRowGroups([csv])).toBe(false);
  });

  it('prend le même en-tête que l’analyse du classeur, sous une rangée de titre large', () => {
    const plan = buildTextGrid('Plan', [
      [
        'Plan d’actions du plan climat air énergie territorial de la communauté de communes',
        'Document de travail validé en comité de pilotage du 12 mars 2024 par les élus',
      ],
      ['Axe', 'Action', 'Statut'],
      ['Mobilité', 'Créer des aires de covoiturage', 'En cours'],
      ['Mobilité', 'Animer une plateforme en ligne', 'En projet'],
    ]);

    const [unit] = cutTabularUnits(pageOf(plan), 3_500, plan);

    expect(textsOf(unit).slice(1)).toEqual([
      'Axe\tAction\tStatut',
      'Mobilité\tCréer des aires de covoiturage\tEn cours',
      'Mobilité\tAnimer une plateforme en ligne\tEn projet',
    ]);
  });

  it('reconnaît un bandeau hors de la première colonne, nommé axe ou étalé sur plusieurs colonnes', async () => {
    const grids = await readWorkbookGrids(
      await buildTestWorkbook([
        {
          name: 'Plan',
          rows: [
            ['N°', 'Action', 'Pilote'],
            [null, 'Axe 1 – Se déplacer autrement'],
            [1, 'Covoiturer entre collègues', 'Interco'],
            [2, 'Pédaler jusqu’à la gare', 'Commune'],
            [null, 'Rénover les bâtiments publics'],
            [3, 'Isoler les écoles', 'Interco'],
            [4, 'Équiper les toits', 'Commune'],
          ],
          merges: ['B5:C5'],
        },
      ])
    );
    if (!grids.success) {
      throw new Error(grids.error.kind);
    }
    const [plan] = grids.data;

    const units = cutTabularUnits(pageOf(plan), 3_500, plan);

    expect(units.map(({ headingPath }) => headingPath)).toEqual([
      ['Plan', 'Axe 1 – Se déplacer autrement'],
      ['Plan', 'Rénover les bâtiments publics'],
    ]);
  });
});

describe('cutTabularUnits sans grille', () => {
  it('garde la première ligne pour en-tête et coupe au volume', () => {
    const rows = Array.from(
      { length: 30 },
      (_, i) => `Axe ${i % 3}\tAction ${i}`
    );
    const page = buildPage(
      0,
      ['axe\ttitre', ...rows].map((text) => ({ text })),
      { label: 'Actions' }
    );

    const units = cutTabularUnits(page, 60);

    expect(units.length).toBeGreaterThan(1);
    for (const unit of units) {
      expect(unit.lines[0].text).toBe('axe\ttitre');
      expect(unit.headingPath).toEqual(['Actions']);
    }
    expect(units.flatMap((unit) => textsOf(unit).slice(1))).toEqual(rows);
  });
});

describe('hasMergedRowGroups', () => {
  it('reconnaît des fiches fusionnées sur plusieurs rangées', () => {
    expect(hasMergedRowGroups(workbook)).toBe(true);
  });

  it('ne voit rien dans un tableau plat, une rangée par fiche', () => {
    const plat = buildTextGrid('', [
      ['Axe', 'Action'],
      ['Mobilité', 'Covoiturer'],
      ['Énergie', 'Isoler'],
    ]);

    expect(hasMergedRowGroups([plat])).toBe(false);
  });
});
