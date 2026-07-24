import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { JSX, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { AddYearColumnHeader } from '../add-year-column-header';
import { Year, toYear } from '../types';

describe('AddYearColumnHeader', () => {
  it('ouvre la saisie au clic puis appelle onAddYear', () => {
    const onAddYear = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <AddYearColumnHeader years={[toYear(2024)]} onAddYear={onAddYear} />
          </tr>
        </thead>
      </table>
    );

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2040' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onAddYear).toHaveBeenCalledWith(toYear(2040));
  });

  it('affiche une erreur inline si doublon', () => {
    render(
      <table>
        <thead>
          <tr>
            <AddYearColumnHeader years={[toYear(2040)]} onAddYear={vi.fn()} />
          </tr>
        </thead>
      </table>
    );

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2040' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(
      screen.getByText(appLabels.indicateurAnneeDejaPresente)
    ).toBeTruthy();
  });

  it('affiche une erreur inline si année hors bornes', () => {
    render(
      <table>
        <thead>
          <tr>
            <AddYearColumnHeader years={[toYear(2024)]} onAddYear={vi.fn()} />
          </tr>
        </thead>
      </table>
    );

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1900' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(
      screen.getByText(appLabels.indicateurAnneeInvalide(1990, 2100))
    ).toBeTruthy();
  });

  it('Échap referme la saisie sans appeler onAddYear', () => {
    const onAddYear = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <AddYearColumnHeader years={[toYear(2024)]} onAddYear={onAddYear} />
          </tr>
        </thead>
      </table>
    );

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2040' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onAddYear).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    ).toBeTruthy();
  });

  it('blur avec champ vide referme la saisie sans callback', () => {
    const onAddYear = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <AddYearColumnHeader years={[toYear(2024)]} onAddYear={onAddYear} />
          </tr>
        </thead>
      </table>
    );

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    );
    fireEvent.blur(screen.getByRole('textbox'));

    expect(onAddYear).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    ).toBeTruthy();
  });

  it('appelle onAdded après un ajout réussi', () => {
    const onAdded = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <AddYearColumnHeader
              years={[toYear(2024)]}
              onAddYear={vi.fn()}
              onAdded={onAdded}
            />
          </tr>
        </thead>
      </table>
    );

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2040' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onAdded).toHaveBeenCalledWith(toYear(2040));
  });

  // Simulates the real grid: the parent owns `years` and re-renders the
  // body with a new focusable cell (`data-cell-id`) once the year is added.
  const FocusableGrid = (): JSX.Element => {
    const [years, setYears] = useState<Year[]>([toYear(2024)]);
    return (
      <table>
        <thead>
          <tr>
            <AddYearColumnHeader
              years={years}
              onAddYear={(year) =>
                setYears((previous) => [...previous, year].sort((a, b) => a - b))
              }
            />
          </tr>
        </thead>
        <tbody>
          <tr>
            {years.map((year) => (
              <td key={year}>
                <button type="button" data-cell-id={`1:${year}`}>
                  {year}
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  };

  it('focus la première cellule éditable de la nouvelle colonne après ajout', async () => {
    render(<FocusableGrid />);

    fireEvent.click(
      screen.getByRole('button', { name: appLabels.indicateurAjouterAnnee })
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2040' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: '2040' })
      );
    });
  });
});
