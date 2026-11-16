import { describe, expect, it } from 'vitest';
import { buildPcaetDiagnosticIndicateurTables } from './demarche-pcaet-diagnostic-tables.rules';
import { PCAET_DIAGNOSTIC_INDICATEURS } from './demarche-pcaet-diagnostic.config';
import type { PcaetDiagnosticIndicateurParentConfig } from './demarche-pcaet-diagnostic.schema';

const byCode = (code: string): PcaetDiagnosticIndicateurParentConfig => {
  const config = PCAET_DIAGNOSTIC_INDICATEURS.find(
    (topic) => topic.code === code
  );
  if (config === undefined) {
    throw new Error(`Topic ${code} absent de la config`);
  }
  return config;
};

const rowLabels = (table: { rows: { label: string }[] }) =>
  table.rows.map((row) => row.label);

describe('buildPcaetDiagnosticIndicateurTables', () => {
  it('regroupe les émissions GES en une table (année de référence au parent)', () => {
    const tables = buildPcaetDiagnosticIndicateurTables(
      byCode('emissions_ges')
    );

    expect(tables).toHaveLength(1);
    expect(tables[0].title).toBe('Émissions GES');
    expect(rowLabels(tables[0])).toEqual([
      'Résidentiel',
      'Tertiaire',
      'Transport routier',
      'Autres transports',
      'Agriculture',
      'Déchets',
      'Industrie hors branche énergie',
      'Industrie branche énergie',
    ]);
  });

  it('crée une table par polluant, avec les secteurs en lignes', () => {
    const tables = buildPcaetDiagnosticIndicateurTables(
      byCode('polluants_atmospheriques')
    );

    expect(tables.map((table) => table.title)).toEqual([
      'NOx',
      'PM10',
      'PM2.5',
      'COVNM',
      'SO2',
      'NH3',
    ]);
    expect(rowLabels(tables[0])).toEqual([
      'Résidentiel',
      'Tertiaire',
      'Transport routier',
      'Autres transports',
      'Agriculture',
      'Déchets',
      'Industrie hors branche énergie',
      'Industrie branche énergie',
    ]);
  });

  it('regroupe les puits de séquestration dans une seule table obligatoire', () => {
    const tables = buildPcaetDiagnosticIndicateurTables(
      byCode('sequestration')
    );

    expect(tables).toHaveLength(1);
    expect(tables[0].title).toBe('Séquestration carbone');
    expect(tables[0].isOptional).toBe(false);
    expect(rowLabels(tables[0])).toEqual([
      'Forêt',
      'Sols agricoles (terres cultivées et prairies)',
      'Produits bois',
      'Autres sols',
    ]);
  });

  it('sépare production et consommation ENR, une table par groupe', () => {
    const tables = buildPcaetDiagnosticIndicateurTables(byCode('enr'));
    const chaleur = [
      'Biomasse solide',
      'Pompes à chaleur',
      'Géothermie',
      'Solaire thermique',
      'Biogaz',
    ];

    expect(
      tables.map((table) => [table.section, table.title, rowLabels(table)])
    ).toEqual([
      [
        "Production d'énergie",
        'Électricité',
        [
          'Éolien terrestre',
          'Solaire photovoltaïque',
          'Hydraulique',
          'Biomasse solide',
          'Biogaz',
        ],
      ],
      ["Production d'énergie", 'Chaleur', chaleur],
      ["Production d'énergie", 'Froid', ['Thermique']],
      ["Production d'énergie", 'Autres', ['Biométhane', 'Biocarburants']],
      ["Consommation d'énergie", 'Chaleur', chaleur],
      ["Consommation d'énergie", 'Autres', ['Biocarburants']],
      [
        "Valorisation des potentiels d'énergie",
        'Récupération et stockage',
        ['Récupération', 'Stockage'],
      ],
    ]);
  });

  it('ne produit pas de table sans ligne saisissable', () => {
    const tables = buildPcaetDiagnosticIndicateurTables({
      code: 'vide',
      label: 'Vide',
      icon: 'sun-line',
      indicateurDefinitionId: 'cae_3.a',
      referenceYearApplyLevel: 'child',
      children: [
        { label: 'Inconnu', indicateurDefinitionId: '', groupBy: 'Autres' },
      ],
    });

    expect(tables).toEqual([]);
  });
});
