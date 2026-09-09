import { describe, expect, it } from 'vitest';
import { fakeRow } from '../../../../indicateurs/valeurs/grid/__tests__/grid-fixtures';
import { buildDiagnosticIndicateurTableRows } from './diagnostic-indicateur-table.adapter';
import type { DiagnosticIndicateurTable } from './indicateur-tab.layout';

const createTable = (): DiagnosticIndicateurTable => {
  const row = fakeRow({ indicateurId: 1, indicateurLabel: 'Émissions' });
  return {
    id: 'emissions',
    title: 'Émissions',
    isOptional: false,
    rows: [
      {
        label: row.indicateurLabel,
        indicateurDefinitionId: 'fake_1',
        optionalYears: [],
      },
    ],
    indicateurDefinitions: [row.indicateurDefinition],
    indicateurValeurs: row.indicateurValeurs.map((indicateurValeur) => ({
      indicateurValeur,
      indicateurDefinition: row.indicateurDefinition,
      indicateurSourceMetadonnee: null,
    })),
  };
};

describe('buildDiagnosticIndicateurTableRows', () => {
  it('keeps canonical annual values', () => {
    const table = createTable();
    expect(
      buildDiagnosticIndicateurTableRows(table)[0].indicateurValeurs
    ).toEqual(
      table.indicateurValeurs.map(({ indicateurValeur }) => indicateurValeur)
    );
  });
  it('rejects a monthly definition even without values', () => {
    const table = createTable();
    table.indicateurDefinitions[0].periodicite = 'mensuelle';
    table.indicateurValeurs = [];
    expect(() => buildDiagnosticIndicateurTableRows(table)).toThrow(
      'périodicité annuelle'
    );
  });
  it('rejects an annual value stored in the middle of a year', () => {
    const table = createTable();
    table.indicateurValeurs[0].indicateurValeur.dateValeur = '2025-06-01';
    expect(() => buildDiagnosticIndicateurTableRows(table)).toThrow();
  });
});
