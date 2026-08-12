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

  it('signale les constats par un marqueur focusable, sans hauteur ajoutée', () => {
    render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="resultat"
              cell={{
                resultat: 10,
                objectif: 20,
                references: [
                  { label: 'RARE-OREC', millesime: '2024-07-18', resultat: 27.42 },
                  { label: 'Atmo', millesime: null, resultat: 26.9 },
                ],
              }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );

    // Un bouton, pour être atteignable au clavier : les cellules de cette
    // grille ne prennent pas le focus en lecture seule.
    expect(
      screen.getByRole('button', { name: '2 constats de sources extérieures' })
    ).toBeDefined();
    // Le détail n'occupe pas la cellule : il vit dans l'info-bulle.
    expect(screen.queryByText('RARE-OREC')).toBeNull();
  });

  it('accorde le libellé du marqueur au nombre de constats', () => {
    render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="resultat"
              cell={{
                resultat: 10,
                objectif: null,
                references: [
                  { label: 'RARE-OREC', millesime: null, resultat: 27.42 },
                  // Sans constat, une source ne compte pas.
                  { label: 'Atmo', millesime: null, resultat: null },
                ],
              }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );

    expect(
      screen.getByRole('button', { name: '1 constat d’une source extérieure' })
    ).toBeDefined();
  });

  it('n’affiche aucun marqueur sans constat renseigné', () => {
    render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="resultat"
              cell={{
                resultat: 10,
                objectif: null,
                references: [{ label: 'Atmo', millesime: null, resultat: null }],
              }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('empile les constats sous la valeur en variante liste', () => {
    render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="resultat"
              referencesVariant="list"
              cell={{
                resultat: 10,
                objectif: 20,
                references: [
                  { label: 'RARE-OREC', millesime: '2024-07-18', resultat: 27.42 },
                  { label: 'Atmo', millesime: null, resultat: null },
                ],
              }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText('27.42')).toBeDefined();
    expect(screen.getByText('RARE-OREC')).toBeDefined();
    // Une source sans constat n'occupe pas de place.
    expect(screen.queryByText('Atmo')).toBeNull();
  });

  it('n’affiche pas les constats en regard de l’objectif', () => {
    render(
      <table>
        <tbody>
          <tr>
            <IndicateurValeurCell
              field="objectif"
              cell={{
                resultat: 10,
                objectif: 20,
                references: [
                  { label: 'RARE-OREC', millesime: '2024-07-18', resultat: 27.42 },
                ],
              }}
              indicateurId={toIndicateurId(12)}
              year={toYear(2026)}
            />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('RARE-OREC')).toBeNull();
  });
});
