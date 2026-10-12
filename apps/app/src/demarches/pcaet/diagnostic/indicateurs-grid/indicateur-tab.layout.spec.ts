import {
  PCAET_DIAGNOSTIC_INDICATEURS,
  type PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriods,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { fakeRow } from '../../../../indicateurs/valeurs/grid/__tests__/grid-fixtures';
import { buildDiagnosticIndicateurTableRows } from './diagnostic-indicateur-table.adapter';
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
        (row) => row.optionalYears !== 'all' && row.optionalYears.includes(2050)
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

  it('crée une table obligatoire par puits de séquestration', () => {
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
    expect(sections[0].tables.some((table) => table.isOptional)).toBe(false);
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

describe('obligations des valeurs du diagnostic PCAET', () => {
  const period = (year: number) =>
    IndicateurPeriods.parse(IndicateurPeriodiciteEnum.ANNUELLE, String(year));
  const buildRow = (
    optionalYears: readonly number[] | 'all',
    isApplicable = true
  ) => {
    const fixture = fakeRow({
      indicateurId: 12,
      indicateurLabel: 'Résidentiel',
    });
    return buildDiagnosticIndicateurTableRows({
      id: 'emissions_ges',
      title: 'Émissions GES',
      isOptional: false,
      rows: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_63.b',
          optionalYears,
        },
      ],
      indicateurDefinitions: [
        {
          ...fixture.indicateurDefinition,
          identifiantReferentiel: 'cae_63.b',
          isApplicable,
        },
      ],
      indicateurValeurs: [],
    })[0];
  };

  it.each([
    { year: 2030, required: true },
    { year: 2050, required: false },
  ])('exige la valeur de $year : $required', ({ year, required }) => {
    expect(buildRow([2050]).isValeurRequired(period(year))).toBe(required);
  });

  it("réclame la référence tant qu'elle n'est pas choisie", () => {
    expect(buildRow([2050]).isValeurRequired(null)).toBe(true);
  });

  it.each([period(2030), null])(
    'ne réclame aucune valeur pour une ligne facultative',
    (period) => {
      expect(buildRow('all').isValeurRequired(period)).toBe(false);
    }
  );

  it.each([period(2030), null])(
    'ne réclame aucune valeur pour un indicateur non applicable',
    (period) => {
      expect(buildRow([], false).isValeurRequired(period)).toBe(false);
    }
  );
});
