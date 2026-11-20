import type {
  DemarchePcaetVulnerabiliteThematique,
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import { Workbook } from 'exceljs';
import { describe, expect, it } from 'vitest';
import { exportDiagnosticXLSX } from './export-diagnostic.xlsx';

const GES: PcaetDiagnosticIndicateurParentConfig = {
  code: 'ges',
  label: 'GES',
  icon: 'fire-line',
  indicateurDefinitionId: 'cae_1.a',
  referenceYearApplyLevel: 'parent',
  children: [{ label: 'Résidentiel', indicateurDefinitionId: 'cae_1.c' }],
};

const thematique = (
  id: number,
  label: string,
  parentId: number | null = null
): DemarchePcaetVulnerabiliteThematique => ({
  id,
  code: null,
  label,
  parentId,
  requis: false,
  isSocle: false,
});

const diagnostic = {
  indicateurParentConfigs: [GES],
  indicateurDefinitions: [
    { id: 1, identifiantReferentiel: 'cae_1.a', titre: 'GES', unite: 'kteq' },
    {
      id: 2,
      identifiantReferentiel: 'cae_1.c',
      titre: 'GES résidentiel',
      unite: 'kteq',
    },
  ],
  indicateurValeurs: [
    {
      indicateurValeur: {
        periodicite: 'annuelle',
        dateValeur: '2022-01-01',
        resultat: 120,
        objectif: null,
      },
      indicateurDefinition: { id: 2, periodicite: 'annuelle' },
      indicateurSourceMetadonnee: {
        id: 7,
        sourceId: 'pcaet-collectivite',
        dateVersion: '2026-01-01',
      },
    },
  ],
  vulnerabilite: {
    code: 'vulnerabilite_territoire',
    label: 'Vulnérabilité du territoire',
    icon: 'map-2-line',
    horizons: [2050, 2100],
    thematiques: [
      // La sous-thématique précède sa parente dans la liste servie.
      thematique(3, 'Inondations', 2),
      thematique(1, 'Ressource en eau'),
      thematique(2, 'Risques naturels'),
      // Sous-thématique dont la parente n'est pas servie.
      thematique(4, 'Submersion', 99),
    ],
    lignes: [
      {
        thematiqueId: 1,
        niveauMaintenant: 'moyen',
        niveau2050: 'fort',
        niveau2100: 'fort',
        objectifs2050: 'Réduire les prélèvements',
        objectifs2100: null,
      },
      {
        thematiqueId: 3,
        niveauMaintenant: 'non_concerne',
        niveau2050: null,
        niveau2100: 'faible',
        objectifs2050: null,
        objectifs2100: 'Adapter le bâti',
      },
    ],
  },
} as unknown as PcaetDiagnostic;

const loadWorkbook = async () => {
  const workbook = new Workbook();
  await workbook.xlsx.load(await exportDiagnosticXLSX(diagnostic));
  return workbook;
};

const rowValues = (
  workbook: Workbook,
  sheetName: string,
  rowNumber: number
) => {
  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) throw new Error(`Onglet ${sheetName} absent`);
  const row = worksheet.getRow(rowNumber);
  return Array.from({ length: worksheet.columnCount }, (_, i) => {
    // Une cellule vide se relit `null` ou `''` selon qu'elle a été écrite.
    const value = row.getCell(i + 1).value;
    return value === '' ? null : value ?? null;
  });
};

describe('exportDiagnosticXLSX', () => {
  it('produit les onglets Indicateurs et Vulnérabilité', async () => {
    const workbook = await loadWorkbook();
    expect(workbook.worksheets.map((ws) => ws.name)).toEqual([
      'Indicateurs',
      'Vulnérabilité',
    ]);
  });

  it('range les valeurs sur la ligne principale, sous leur catégorie, sans colonnes de métadonnées', async () => {
    const workbook = await loadWorkbook();

    expect(rowValues(workbook, 'Indicateurs', 1)).toEqual([
      'Identifiant',
      "Nom de l'indicateur",
      'Catégorie',
      'Unité',
      '2022 Résultat',
    ]);
    // L'agrégat du volet (cae_1.a) n'est pas une ligne de l'écran.
    expect(rowValues(workbook, 'Indicateurs', 2)).toEqual([
      'cae_1.c',
      'Résidentiel',
      'GES',
      'kteq',
      120,
    ]);
    expect(workbook.getWorksheet('Indicateurs')?.rowCount).toBe(2);
  });

  it('rend la vulnérabilité, chaque sous-thématique sous sa parente', async () => {
    const workbook = await loadWorkbook();

    expect(rowValues(workbook, 'Vulnérabilité', 1)).toEqual([
      'Thématique',
      'Sous-thématique',
      'Vulnérabilité actuelle',
      'Vulnérabilité 2050',
      'Vulnérabilité 2100',
      'Objectifs 2050',
      'Objectifs 2100',
    ]);
    expect(rowValues(workbook, 'Vulnérabilité', 2)).toEqual([
      'Ressource en eau',
      null,
      'Moyen',
      'Fort',
      'Fort',
      'Réduire les prélèvements',
      null,
    ]);
    // Thématique sans saisie : ligne présente, cellules vides.
    expect(rowValues(workbook, 'Vulnérabilité', 3)).toEqual([
      'Risques naturels',
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(rowValues(workbook, 'Vulnérabilité', 4)).toEqual([
      'Risques naturels',
      'Inondations',
      'Non concerné',
      null,
      'Faible',
      null,
      'Adapter le bâti',
    ]);
    // Sans parente servie, elle remonte à la racine plutôt que de disparaître.
    expect(rowValues(workbook, 'Vulnérabilité', 5)).toEqual([
      'Submersion',
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(workbook.getWorksheet('Vulnérabilité')?.rowCount).toBe(5);
  });
});
