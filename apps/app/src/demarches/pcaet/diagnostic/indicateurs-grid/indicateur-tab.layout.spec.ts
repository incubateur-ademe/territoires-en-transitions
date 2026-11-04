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
import { buildIndicateurValeursTables } from './indicateur-tab.layout';

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

describe('buildIndicateurValeursTables', () => {
  it('regroupe les émissions GES en une table (année de référence au parent)', () => {
    const tables = buildIndicateurValeursTables(byCode('emissions_ges'));

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
    const tables = buildIndicateurValeursTables(
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
    const tables = buildIndicateurValeursTables(byCode('sequestration'));

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
    const tables = buildIndicateurValeursTables(byCode('enr'));
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
    const tables = buildIndicateurValeursTables({
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

describe('obligations des valeurs du diagnostic PCAET', () => {
  const periode = (year: number) =>
    IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, String(year));
  const buildRow = (
    isOptional = false,
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
      section: null,
      isOptional: false,
      rows: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_63.b',
          isOptional,
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
    expect(() => buildRow(false, true, periodicite)).toThrow(
      'INDICATEUR_ANNUAL_PERIODICITE_REQUIRED'
    );
  });

  it.each([2030, 2036, 2050])('exige la valeur de %i', (year) => {
    expect(buildRow().isValeurRequired(periode(year))).toBe(true);
  });

  it("réclame la référence tant qu'elle n'est pas choisie", () => {
    expect(buildRow().isValeurRequired(null)).toBe(true);
  });

  it.each([periode(2030), null])(
    'ne réclame aucune valeur pour une ligne facultative',
    (periode) => {
      expect(buildRow(true).isValeurRequired(periode)).toBe(false);
    }
  );

  it.each([periode(2030), null])(
    'ne réclame aucune valeur pour un indicateur non applicable',
    (periode) => {
      expect(buildRow(false, false).isValeurRequired(periode)).toBe(false);
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
