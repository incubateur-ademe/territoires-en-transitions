import type { SousIndicateursChartData } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-chart.rules';
import { appLabels } from '@/app/labels/catalog';
import { SOUS_INDICATEURS_TOTAL_COLOR } from '@/app/indicateurs/sous-indicateurs/sous-indicateurs-colors';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import {
  toSousIndicateursChartOption,
  toSousIndicateursChartSeries,
} from './indicateur-sous-indicateurs-chart.option';

type StackedData = Extract<SousIndicateursChartData, { mode: 'stacked' }>;

const DATES = ['2022-01-01', '2023-01-01'] as const;

const toStackedData = (overrides: Partial<StackedData> = {}): StackedData => ({
  mode: 'stacked',
  dates: DATES,
  leaves: [
    {
      indicateurId: 4,
      label: 'Emballages',
      color: 'emballages-color',
      valeurs: [10, null],
    },
    { indicateurId: 2, label: 'Verre', color: 'verre-color', valeurs: [3, 4] },
  ],
  resultatTotal: [13, null],
  objectifTotal: null,
  ...overrides,
});

const OBJECTIF_TOTAL_NAME = appLabels.indicateurSousIndicateursObjectifDe({
  label: appLabels.indicateurSousIndicateursTotal,
});

const toNames = (data: SousIndicateursChartData): unknown[] =>
  toSousIndicateursChartSeries(data).series.map(({ name }) => name);

describe('toSousIndicateursChartSeries', () => {
  describe('en mode empilé', () => {
    it("empile les feuilles dans l'ordre reçu puis trace la courbe du total", () => {
      expect(toNames(toStackedData())).toEqual([
        'Emballages',
        'Verre',
        appLabels.indicateurSousIndicateursTotal,
      ]);
    });

    it('empile les feuilles sur une même pile et ne met pas la courbe du total dans la pile', () => {
      const [emballages, verre, total] = toSousIndicateursChartSeries(
        toStackedData()
      ).series;

      expect(emballages.stack).toBeDefined();
      expect(verre.stack).toBe(emballages.stack);
      expect(total.stack).toBeUndefined();
    });

    it('ajoute la courbe du total des objectifs quand il existe', () => {
      expect(toNames(toStackedData({ objectifTotal: [20, 22] }))).toEqual([
        'Emballages',
        'Verre',
        appLabels.indicateurSousIndicateursTotal,
        OBJECTIF_TOTAL_NAME,
      ]);
    });

    it('ne trace aucune courbe du total quand il est absent', () => {
      expect(toNames(toStackedData({ resultatTotal: null }))).toEqual([
        'Emballages',
        'Verre',
      ]);
    });

    it('aligne les valeurs de chaque série sur les dates, avec un trou pour une valeur absente', () => {
      const { datasets } = toSousIndicateursChartSeries(toStackedData());

      expect(datasets).toEqual([
        expect.objectContaining({
          id: 'sous-indicateur-4',
          source: [
            { dateValeurISO: '2022-01-01T00:00:00.000Z', valeur: 10 },
            { dateValeurISO: '2023-01-01T00:00:00.000Z', valeur: null },
          ],
        }),
        expect.objectContaining({ id: 'sous-indicateur-2' }),
        expect.objectContaining({
          id: 'resultat-total',
          source: [
            { dateValeurISO: '2022-01-01T00:00:00.000Z', valeur: 13 },
            { dateValeurISO: '2023-01-01T00:00:00.000Z', valeur: null },
          ],
        }),
      ]);
    });

    it('donne aux feuilles la couleur reçue et au total la couleur du total, la même pour son objectif', () => {
      const { series } = toSousIndicateursChartSeries(
        toStackedData({ objectifTotal: [20, 22] })
      );

      expect(series.map(({ color }) => color)).toEqual([
        'emballages-color',
        'verre-color',
        SOUS_INDICATEURS_TOTAL_COLOR,
        SOUS_INDICATEURS_TOTAL_COLOR,
      ]);
    });

    it('trace le total des objectifs en tirets avec des points creux et le total du résultat en trait plein avec des points pleins', () => {
      const [, , resultatTotal, objectifTotal] = toSousIndicateursChartSeries(
        toStackedData({ objectifTotal: [20, 22] })
      ).series;

      expect(resultatTotal).toMatchObject({
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2 },
      });
      expect(resultatTotal.lineStyle).not.toHaveProperty('type');
      expect(objectifTotal).toMatchObject({
        symbol: 'emptyCircle',
        symbolSize: 8,
        lineStyle: { type: 'dashed' },
      });
    });
  });

  describe('en mode lignes', () => {
    const lines: SousIndicateursChartData = {
      mode: 'lines',
      dates: DATES,
      lines: [
        {
          indicateurId: 3,
          label: 'Collectes sélectives',
          color: 'collectes-color',
          resultatValeurs: [15, 18],
          objectifValeurs: [20, null],
        },
        {
          indicateurId: 2,
          label: 'Verre',
          color: 'verre-color',
          resultatValeurs: [3, 4],
          objectifValeurs: null,
        },
      ],
    };

    it('trace une ligne de résultats par enfant direct suivie de celle de ses objectifs quand il en a, sans empilement', () => {
      const { series } = toSousIndicateursChartSeries(lines);

      expect(series.map(({ name }) => name)).toEqual([
        'Collectes sélectives',
        appLabels.indicateurSousIndicateursObjectifDe({
          label: 'Collectes sélectives',
        }),
        'Verre',
      ]);
      expect(series.every(({ stack }) => stack === undefined)).toBe(true);
    });

    it("donne à l'objectif d'un enfant la couleur de ses résultats", () => {
      const { series } = toSousIndicateursChartSeries(lines);

      expect(series.map(({ color }) => color)).toEqual([
        'collectes-color',
        'collectes-color',
        'verre-color',
      ]);
    });

    it('trace les résultats en trait plein avec des points pleins et les objectifs en tirets avec des points creux', () => {
      const [resultat, objectif] = toSousIndicateursChartSeries(lines).series;

      expect(resultat).toMatchObject({ symbol: 'circle', symbolSize: 8 });
      expect(resultat.lineStyle).not.toHaveProperty('type');
      expect(objectif).toMatchObject({
        symbol: 'emptyCircle',
        symbolSize: 8,
        lineStyle: { type: 'dashed' },
      });
    });

    it("ne trace pas de courbe de résultats pour un enfant qui n'en a pas", () => {
      const { series } = toSousIndicateursChartSeries({
        mode: 'lines',
        dates: DATES,
        lines: [
          {
            indicateurId: 2,
            label: 'Verre',
            color: 'verre-color',
            resultatValeurs: null,
            objectifValeurs: [5, 6],
          },
        ],
      });

      expect(series.map(({ name }) => name)).toEqual([
        appLabels.indicateurSousIndicateursObjectifDe({ label: 'Verre' }),
      ]);
    });
  });
});

describe('toSousIndicateursChartOption', () => {
  const toOption = (data: SousIndicateursChartData) =>
    toSousIndicateursChartOption({
      data,
      unite: 't',
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    });

  it("affiche l'unité en sous-titre", () => {
    expect(toOption(toStackedData()).title).toMatchObject({ subtext: 't' });
  });

  it("masque les libellés des bornes de l'axe quand il n'y a qu'une date", () => {
    const option = toOption(
      toStackedData({
        dates: ['2022-01-01'],
        leaves: [
          {
            indicateurId: 2,
            label: 'Verre',
            color: 'verre-color',
            valeurs: [3],
          },
        ],
        resultatTotal: [3],
      })
    );

    expect(option.xAxis).toMatchObject({
      axisLabel: { showMinLabel: false, showMaxLabel: false },
    });
  });

  it('place dans la légende le total et son objectif avant les feuilles empilées', () => {
    const option = toOption(toStackedData({ objectifTotal: [20, 22] }));

    expect(option.legend).toMatchObject({
      data: [
        expect.objectContaining({
          name: appLabels.indicateurSousIndicateursTotal,
        }),
        expect.objectContaining({ name: OBJECTIF_TOTAL_NAME }),
        'Emballages',
        'Verre',
      ],
    });
  });

  it("garde l'ordre des lignes dans la légende quand le cumul est décoché", () => {
    const option = toOption({
      mode: 'lines',
      dates: DATES,
      lines: [
        {
          indicateurId: 3,
          label: 'Collectes',
          color: 'collectes-color',
          resultatValeurs: [1, 2],
          objectifValeurs: [3, 4],
        },
        {
          indicateurId: 2,
          label: 'Verre',
          color: 'verre-color',
          resultatValeurs: [1, 2],
          objectifValeurs: null,
        },
      ],
    });

    expect(option.legend).toMatchObject({
      data: [
        expect.objectContaining({ name: 'Collectes' }),
        expect.objectContaining({
          name: appLabels.indicateurSousIndicateursObjectifDe({
            label: 'Collectes',
          }),
        }),
        expect.objectContaining({ name: 'Verre' }),
      ],
    });
  });
});
