import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
