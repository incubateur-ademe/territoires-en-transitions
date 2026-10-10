import { describe, expect, it } from 'vitest';
import {
  IndicateurPeriods,
  type IndicateurPeriod,
} from '@tet/domain/indicateurs';
import { prepareData, type PreparedData } from '../data/prepare-data';
import { prepareIndicateurTableData } from './prepare-indicateur-table-data';

const january = IndicateurPeriods.parse('mensuelle', '2026-01');
const annual = IndicateurPeriods.parse('annuelle', '2026');
const base = prepareData(undefined, 'resultat', true);
const local = base.sources[0];
const source = (id: number, period: IndicateurPeriod = january) =>
  ({
    ...local,
    source: 'open-data',
    periodiciteSource: period.periodicite,
    metadonnees: [
      {
        id,
        sourceId: 'open-data',
        dateVersion: '2026-01-01',
        nomDonnees: null,
        diffuseur: null,
        producteur: null,
        methodologie: null,
        limites: null,
      },
    ],
    valeurs: [],
  } as PreparedData['sources'][number]);

describe('préparation du tableau combiné', () => {
  it('réunit résultat et objectif sans fusionner les versions ou périodicités', () => {
    const resultats = {
      ...base,
      sources: [source(1), source(2), source(1, annual)],
      periodes: [january, annual],
    };
    const objectifs = {
      ...base,
      sources: [source(1), source(3)],
      periodes: [january],
    };
    const result = prepareIndicateurTableData(resultats, objectifs);
    expect(result.sources).toHaveLength(4);
    expect(result.sources[0].resultats).toBeDefined();
    expect(result.sources[0].objectifs).toBeDefined();
    expect(result.sources[1].objectifs).toBeUndefined();
    expect(result.sources[3].resultats).toBeUndefined();
    expect(result.periodes).toHaveLength(2);
  });
  it('conserve les brouillons, les trie et déduplique une période enregistrée', () => {
    const february = IndicateurPeriods.parse('mensuelle', '2026-02');
    expect(
      prepareIndicateurTableData({ ...base, periodes: [january] }, base, [
        february,
        january,
      ]).periodes
    ).toEqual([january, february]);
  });
});
