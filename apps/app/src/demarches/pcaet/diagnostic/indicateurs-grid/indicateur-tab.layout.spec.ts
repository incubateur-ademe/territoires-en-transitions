import {
  PCAET_DIAGNOSTIC_INDICATEURS,
  type PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import { buildIndicateurValeursTableSections } from './indicateur-tab.layout';

const byCode = (code: string): PcaetDiagnosticIndicateurParentConfig => {
  const config = PCAET_DIAGNOSTIC_INDICATEURS.find(
    (topic) => topic.code === code
  );
  if (config === undefined) {
    throw new Error(`Topic ${code} absent de la config`);
  }
  return config;
};

describe('buildIndicateurValeursTableSections', () => {
  it('regroupe les émissions GES en une table (année de référence au parent)', () => {
    const sections = buildIndicateurValeursTableSections(
      byCode('emissions_ges')
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBeNull();
    expect(sections[0].tables).toHaveLength(1);
    expect(sections[0].tables[0].title).toBe('Émissions GES');
    expect(sections[0].tables[0].rows.map((row) => row.label)).toEqual([
      'Résidentiel',
      'Tertiaire',
      'Transport routier',
      'Autres transports',
      'Agriculture',
      'Déchets',
      'Industrie hors branche énergie',
      'Industrie branche énergie',
    ]);
    expect(
      sections[0].tables[0].rows.every(
        (row) =>
          row.optionalYears !== 'all' && row.optionalYears.includes(2050)
      )
    ).toBe(true);
  });

  it('crée une table par polluant, avec les secteurs en lignes', () => {
    const sections = buildIndicateurValeursTableSections(
      byCode('polluants_atmospheriques')
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBeNull();
    expect(sections[0].tables.map((table) => table.title)).toEqual([
      'NOx',
      'PM10',
      'PM2.5',
      'COVNM',
      'SO2',
      'NH3',
    ]);
    expect(sections[0].tables[0].rows.map((row) => row.label)).toEqual([
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

  it('crée une table par puits de séquestration', () => {
    const sections = buildIndicateurValeursTableSections(
      byCode('sequestration')
    );

    expect(sections[0].tables.map((table) => table.title)).toEqual([
      'Forêt',
      'Sols agricoles (terres cultivées et prairies)',
      'Produits bois',
      'Autres sols',
    ]);
    expect(sections[0].tables.every((table) => table.rows.length === 1)).toBe(
      true
    );
  });

  it('sépare les ENR par groupBy et écarte les identifiants non résolus', () => {
    const sections = buildIndicateurValeursTableSections(byCode('enr'));

    expect(sections.map((section) => section.label)).toEqual([
      'electricité',
      'chaleur',
    ]);
    expect(sections[0].tables.map((table) => table.title)).toEqual([
      'Éolien terrestre',
      'Solaire photovoltaïque',
      'Biomasse solide',
      'Biogaz',
    ]);
    expect(sections[1].tables.map((table) => table.title)).toEqual([
      'Biomasse solide',
      'Pompes à chaleur',
      'Géothermie',
      'Solaire thermique',
      'Biogaz',
    ]);
  });

  it('ne produit pas de table sans ligne saisissable', () => {
    const sections = buildIndicateurValeursTableSections({
      code: 'vide',
      label: 'Vide',
      icon: 'sun-line',
      indicateurDefinitionId: 'cae_3.a',
      referenceYearApplyLevel: 'child',
      children: [
        { label: 'Inconnu', indicateurDefinitionId: 'TBD', groupBy: 'autres' },
      ],
    });

    expect(sections).toEqual([]);
  });
});
