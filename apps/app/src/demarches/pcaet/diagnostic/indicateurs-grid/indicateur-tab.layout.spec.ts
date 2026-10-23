import {
  PCAET_DIAGNOSTIC_INDICATEURS,
  type PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { fakeRow } from '../../../../indicateurs/valeurs/grid/__tests__/grid-fixtures';
import {
  buildDiagnosticIndicateurTableRows,
  buildDiagnosticIndicateurValeurInput,
} from './diagnostic-indicateur-table.adapter';
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

  it('regroupe les puits de séquestration dans une seule table obligatoire', () => {
    const sections = buildIndicateurValeursTableSections(
      byCode('sequestration')
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].tables).toHaveLength(1);
    expect(sections[0].tables[0].title).toBe('Séquestration carbone');
    expect(sections[0].tables[0].isOptional).toBe(false);
    expect(sections[0].tables[0].rows.map((row) => row.label)).toEqual([
      'Forêt',
      'Sols agricoles (terres cultivées et prairies)',
      'Produits bois',
      'Autres sols',
    ]);
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
  const periode = (year: number) =>
    IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, String(year));
  const buildRow = (
    optionalYears: readonly number[] | 'all',
    isApplicable = true,
    periodicite: IndicateurPeriodicite = IndicateurPeriodiciteEnum.ANNUELLE
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
          periodicite,
        },
      ],
      indicateurValeurs: [],
    })[0];
  };

  it.each([
    IndicateurPeriodiciteEnum.MENSUELLE,
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
  ])('refuse une définition %s dans le diagnostic annuel', (periodicite) => {
    expect(() => buildRow([], true, periodicite)).toThrow(
      'INDICATEUR_ANNUAL_PERIODICITE_REQUIRED'
    );
  });

  it.each([
    { year: 2030, required: true },
    { year: 2050, required: false },
  ])('exige la valeur de $year : $required', ({ year, required }) => {
    expect(buildRow([2050]).isValeurRequired(periode(year))).toBe(required);
  });

  it("réclame la référence tant qu'elle n'est pas choisie", () => {
    expect(buildRow([2050]).isValeurRequired(null)).toBe(true);
  });

  it.each([periode(2030), null])(
    'ne réclame aucune valeur pour une ligne facultative',
    (periode) => {
      expect(buildRow('all').isValeurRequired(periode)).toBe(false);
    }
  );

  it.each([periode(2030), null])(
    'ne réclame aucune valeur pour un indicateur non applicable',
    (periode) => {
      expect(buildRow([], false).isValeurRequired(periode)).toBe(false);
    }
  );
});

describe('adaptation des écritures PCAET', () => {
  it.each([0, null])(
    'conserve la valeur %s en convertissant la période en année',
    (value) => {
      expect(
        buildDiagnosticIndicateurValeurInput({
          indicateurId: 12,
          periode: IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            '2026'
          ),
          field: 'resultat',
          value,
        })
      ).toEqual({ indicateurId: 12, year: 2026, field: 'resultat', value });
    }
  );
});
