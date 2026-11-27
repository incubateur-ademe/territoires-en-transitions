import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurObjectifSparkline } from './indicateur-objectif.sparkline';

const VIEWBOX_WIDTH = 320;

const renderTicks = (
  resultats: { dateValeur: string; valeur: number }[],
  objectifs: { annee: number; valeur: number }[] = []
) => {
  const { container } = render(
    <IndicateurObjectifSparkline
      resultats={resultats}
      objectifs={objectifs}
      cible={objectifs.at(-1) ?? null}
      isOpenData={false}
      formatValeur={String}
      libelleSerie="Résultats de la collectivité"
    />
  );
  return [...container.querySelectorAll('text')]
    .filter((text) => /^\d{4}$/.test(text.textContent ?? ''))
    .map((text) => ({
      annee: text.textContent,
      x: Number(text.getAttribute('x')),
    }));
};

const isInsideViewBox = ({ x }: { x: number }) => x >= 0 && x <= VIEWBOX_WIDTH;

describe('IndicateurObjectifSparkline', () => {
  it('garde dans le dessin l’année d’un résultat infra-annuel seul', () => {
    const ticks = renderTicks([{ dateValeur: '2025-10-01', valeur: 12 }]);

    expect(ticks).toEqual([expect.objectContaining({ annee: '2025' })]);
    expect(ticks.every(isInsideViewBox)).toBe(true);
  });

  it('garde dans le dessin l’année d’un résultat au 1er janvier', () => {
    const ticks = renderTicks([{ dateValeur: '2025-01-01', valeur: 12 }]);

    expect(ticks.every(isInsideViewBox)).toBe(true);
  });

  it('place les années de résultats mensuels et de l’objectif dans le dessin', () => {
    const ticks = renderTicks(
      [
        { dateValeur: '2024-03-01', valeur: 10 },
        { dateValeur: '2025-09-01', valeur: 14 },
      ],
      [{ annee: 2030, valeur: 20 }]
    );

    expect(ticks.map(({ annee }) => annee)).toEqual(
      expect.arrayContaining(['2030', '2024'])
    );
    expect(ticks.every(isInsideViewBox)).toBe(true);
  });

  it('marque le départ du dépôt même hors de la série, avec son année', () => {
    const { container } = render(
      <IndicateurObjectifSparkline
        resultats={[
          { dateValeur: '2021-01-01', valeur: 140 },
          { dateValeur: '2024-01-01', valeur: 124 },
        ]}
        objectifs={[{ annee: 2030, valeur: 90 }]}
        cible={{ annee: 2030, valeur: 90 }}
        depart={{ annee: 2015, valeur: 152 }}
        isOpenData={false}
        formatValeur={String}
        libelleSerie="Résultats de la collectivité"
      />
    );

    const depart = container.querySelector(
      '[data-test="plans.suivi.indicateurs-objectifs.depart"]'
    );
    expect(depart).not.toBeNull();
    const anneeDepart = [...container.querySelectorAll('text')].find(
      (text) => text.textContent === '2015'
    );
    expect(anneeDepart?.getAttribute('class')).toContain('fill-new-1');
  });
});

describe('IndicateurObjectifSparkline : survol et valeur du premier point', () => {
  const rendreAvecSurvol = () => {
    const { container } = render(
      <IndicateurObjectifSparkline
        resultats={[
          { dateValeur: '2021-01-01', valeur: 133 },
          { dateValeur: '2023-01-01', valeur: 100 },
        ]}
        objectifs={[]}
        cible={null}
        isOpenData={false}
        formatValeur={String}
        libelleSerie="Résultats de la collectivité"
      />
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: VIEWBOX_WIDTH,
      height: 120,
      right: VIEWBOX_WIDTH,
      bottom: 120,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    return { container, svg };
  };

  it('affiche la valeur du premier point', () => {
    const { container } = rendreAvecSurvol();
    expect(
      container.querySelector(
        '[data-test="plans.suivi.indicateurs-objectifs.valeur-depart"]'
      )?.textContent
    ).toBe('133');
  });

  it('montre l’année et la valeur du point survolé, puis les efface en quittant', () => {
    const { container, svg } = rendreAvecSurvol();
    expect(container.querySelector('[data-test$="survol"]')).toBeNull();

    // le premier point est à l'abscisse 30 du dessin, ici 1 pour 1
    fireEvent.pointerMove(svg, { clientX: 30 });
    expect(container.querySelector('[data-test$="survol"]')).not.toBeNull();
    expect(screen.getAllByText('2021').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Résultats de la collectivité', { exact: false })
    ).toBeTruthy();

    fireEvent.pointerLeave(svg);
    expect(container.querySelector('[data-test$="survol"]')).toBeNull();
  });
});
