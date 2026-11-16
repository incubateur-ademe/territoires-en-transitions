import { Workbook } from 'exceljs';
import { describe, expect, it } from 'vitest';
import { Plan, PlanFiche } from '../plan-actions.service';
import { exportPlansXLSX } from './export-plan.xlsx';

const buildPlan = (nom: string, titres: string[]): Plan => {
  const root = { id: 1, nom, parent: null, ficheIds: [] };
  return {
    root,
    rows: titres.map((titre, i) => ({
      id: root.id,
      nom,
      parent: null,
      depth: 0,
      path: [],
      fiche: { id: i + 1, titre } as unknown as PlanFiche,
      parentFiche: null,
      secteurs: null,
    })),
    maxDepth: 0,
    anneesNotes: [],
    maxFinanceurs: 0,
  };
};

const loadWorkbook = async (buffer: ArrayBuffer | Buffer) => {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as ArrayBuffer);
  return workbook;
};

// titres des actions, à partir de la 1re ligne de données
const titresOf = (workbook: Workbook, name: string) => {
  const worksheet = workbook.getWorksheet(name);
  const titreCol = (worksheet?.getRow(2).values as unknown[]).indexOf(
    "Titre de l'action"
  );
  return worksheet
    ?.getColumn(titreCol)
    .values.slice(3)
    .filter((value) => value !== undefined);
};

describe('exportPlansXLSX', () => {
  it('produit un onglet par plan, nommé d’après le plan, avec ses propres actions', async () => {
    const workbook = await loadWorkbook(
      await exportPlansXLSX([
        buildPlan('PCAET', ['Isoler les écoles']),
        buildPlan('Plan vélo', ['Créer une piste', 'Former les élèves']),
      ])
    );

    expect(workbook.worksheets.map((ws) => ws.name)).toEqual([
      'PCAET',
      'Plan vélo',
    ]);
    expect(titresOf(workbook, 'PCAET')).toEqual(['Isoler les écoles']);
    expect(titresOf(workbook, 'Plan vélo')).toEqual([
      'Créer une piste',
      'Former les élèves',
    ]);
  });

  it('distingue deux plans de même nom et nomme un plan sans nom', async () => {
    const workbook = await loadWorkbook(
      await exportPlansXLSX([
        buildPlan('Plan climat', ['Action A']),
        buildPlan('Plan climat', ['Action B']),
        buildPlan('', ['Action C']),
      ])
    );

    expect(workbook.worksheets.map((ws) => ws.name)).toEqual([
      'Plan climat',
      'Plan climat (2)',
      'Plan 3',
    ]);
    expect(titresOf(workbook, 'Plan climat (2)')).toEqual(['Action B']);
  });
});
