import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IndicateurValeurCell } from '../indicateur-valeur.cell';
import { toIndicateurId, toYear } from '../types';

describe('IndicateurValeurCell', () => {
  it('affiche la valeur résultat', () => {
    render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="resultat"
              cell={{ resultat: 10, objectif: 20 }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText('10')).toBeDefined();
    expect(
      document.querySelector('[data-cell-id="12:2026:resultat"]')
    ).not.toBeNull();
  });

  it('affiche la valeur objectif', () => {
    render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="objectif"
              cell={{ resultat: 10, objectif: 20 }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText('20')).toBeDefined();
    expect(
      document.querySelector('[data-cell-id="12:2026:objectif"]')
    ).not.toBeNull();
  });

  it('attribue un data-cell-id distinct à chaque champ', () => {
    const { container: resultatContainer } = render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="resultat"
              cell={{ resultat: 10, objectif: 20 }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );
    const { container: objectifContainer } = render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="objectif"
              cell={{ resultat: 10, objectif: 20 }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );

    expect(
      resultatContainer.querySelector('[data-cell-id="12:2026:resultat"]')
    ).not.toBeNull();
    expect(
      objectifContainer.querySelector('[data-cell-id="12:2026:objectif"]')
    ).not.toBeNull();
  });
});
