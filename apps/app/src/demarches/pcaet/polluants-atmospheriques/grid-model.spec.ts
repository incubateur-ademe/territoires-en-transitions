import { describe, expect, it } from 'vitest';
import {
  applyPaste,
  buildGridRows,
  buildTargetGrid,
  countOpenDataProposals,
  DraftCell,
  IndicatorValues,
  PollutantConfig,
  SectorConfig,
} from './grid-model';

const pollutants: PollutantConfig[] = [{ letter: 'a', label: 'NOx' }];
const sectors: SectorConfig[] = [
  { letter: 'a', label: 'Résidentiel' },
  { letter: 'b', label: 'Tertiaire' },
];

const indicators: IndicatorValues[] = [
  {
    identifier: 'cae_4.aa',
    indicateurId: 10,
    collectivite: [{ year: 2015, value: 1000 }],
    openData: [{ year: 2030, value: 700 }],
  },
  {
    identifier: 'cae_4.ab',
    indicateurId: 20,
    collectivite: [],
    openData: [],
  },
];

describe('buildGridRows', () => {
  it('croise chaque secteur avec chaque polluant dans l\'ordre fourni', () => {
    const rows = buildGridRows({
      indicators,
      orderedSectors: sectors,
      orderedPollutants: pollutants,
      years: [2015, 2030],
      referenceYear: 2015,
      draft: new Map(),
    });

    expect(rows.map((row) => row.identifier)).toEqual(['cae_4.aa', 'cae_4.ab']);
    expect(rows[0]).toMatchObject({
      sectorLabel: 'Résidentiel',
      pollutantLabel: 'NOx',
      indicateurId: 10,
      isGroupStart: true,
      groupSize: 1,
    });
  });

  it('superpose la valeur du draft à la valeur serveur', () => {
    const draft = new Map<string, DraftCell>([
      ['10:2030', { indicateurId: 10, year: 2030, field: 'resultat', value: 600 }],
    ]);
    const rows = buildGridRows({
      indicators,
      orderedSectors: [sectors[0]],
      orderedPollutants: pollutants,
      years: [2015, 2030],
      referenceYear: 2015,
      draft,
    });

    const cell2030 = rows[0].cells.find((cell) => cell.year === 2030);
    expect(cell2030?.value).toBe(600);
  });

  it('calcule l\'évolution en % par rapport à l\'année de référence', () => {
    const rows = buildGridRows({
      indicators,
      orderedSectors: [sectors[0]],
      orderedPollutants: pollutants,
      years: [2015, 2030],
      referenceYear: 2015,
      draft: new Map<string, DraftCell>([
        [
          '10:2030',
          { indicateurId: 10, year: 2030, field: 'resultat', value: 600 },
        ],
      ]),
    });

    const cell2030 = rows[0].cells.find((cell) => cell.year === 2030);
    expect(cell2030?.percentageVsReference).toBe(-40);
  });

  it('propose l\'open data uniquement quand la cellule est vide', () => {
    const rows = buildGridRows({
      indicators,
      orderedSectors: [sectors[0]],
      orderedPollutants: pollutants,
      years: [2030],
      referenceYear: 2015,
      draft: new Map(),
    });

    expect(rows[0].cells[0]).toMatchObject({ value: null, proposal: 700 });
  });
});

describe('buildTargetGrid', () => {
  it('cible une cellule éditable par indicateur connu, null sinon', () => {
    const rows = buildGridRows({
      indicators: [indicators[0]],
      orderedSectors: sectors,
      orderedPollutants: pollutants,
      years: [2015],
      referenceYear: 2015,
      draft: new Map(),
    });

    expect(buildTargetGrid(rows)).toEqual([
      [{ indicateurId: 10, year: 2015, field: 'resultat' }],
      [null],
    ]);
  });
});

describe('countOpenDataProposals', () => {
  it('compte les cellules avec une proposition open data', () => {
    const rows = buildGridRows({
      indicators,
      orderedSectors: [sectors[0]],
      orderedPollutants: pollutants,
      years: [2015, 2030],
      referenceYear: 2015,
      draft: new Map(),
    });

    expect(countOpenDataProposals(rows)).toBe(1);
  });
});

describe('applyPaste', () => {
  const targetGrid = [
    [
      { indicateurId: 10, year: 2015, field: 'resultat' as const },
      { indicateurId: 10, year: 2030, field: 'resultat' as const },
    ],
  ];

  it('convertit une valeur relative collée avec l\'année de référence du même collage', () => {
    const outcome = applyPaste({
      paste: '1000\t-40%',
      targetGrid,
      anchor: { row: 0, column: 0 },
      referenceYear: 2015,
      baseReferences: new Map(),
    });

    expect(outcome.cells).toEqual([
      { indicateurId: 10, year: 2015, field: 'resultat', value: 1000 },
      { indicateurId: 10, year: 2030, field: 'resultat', value: 600 },
    ]);
    expect(outcome.errors).toEqual([]);
  });

  it('signale une valeur relative sans référence disponible', () => {
    const outcome = applyPaste({
      paste: '\t-40%',
      targetGrid,
      anchor: { row: 0, column: 0 },
      referenceYear: 2015,
      baseReferences: new Map(),
    });

    expect(outcome.cells).toEqual([]);
    expect(outcome.errors).toEqual([
      { kind: 'relativeWithoutReference', indicateurId: 10, year: 2030 },
    ]);
  });

  it('remonte les erreurs de cellule hors grille', () => {
    const outcome = applyPaste({
      paste: '1000\t900\t50',
      targetGrid,
      anchor: { row: 0, column: 0 },
      referenceYear: 2015,
      baseReferences: new Map(),
    });

    expect(outcome.errors).toEqual([
      {
        kind: 'cell',
        error: { row: 0, column: 2, rawValue: '50', reason: 'out_of_grid' },
      },
    ]);
  });
});
