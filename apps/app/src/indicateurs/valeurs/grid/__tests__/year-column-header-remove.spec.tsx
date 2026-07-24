import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { YearColumnHeader } from '../year-column-header';
import { toYear } from '../types';

describe('YearColumnHeader remove', () => {
  it('retire immédiatement une colonne sans valeurs', () => {
    const onRemoveYear = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <YearColumnHeader
              year={toYear(2040)}
              isReference={false}
              onRemoveYear={onRemoveYear}
              canRemove
              hasValues={false}
            />
          </tr>
        </thead>
      </table>
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurRetirerAnnee(2040),
      })
    );

    expect(onRemoveYear).toHaveBeenCalledWith(toYear(2040));
  });

  it('demande confirmation si hasValues', () => {
    const onRemoveYear = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <YearColumnHeader
              year={toYear(2040)}
              isReference={false}
              onRemoveYear={onRemoveYear}
              canRemove
              hasValues
            />
          </tr>
        </thead>
      </table>
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurRetirerAnnee(2040),
      })
    );

    expect(onRemoveYear).not.toHaveBeenCalled();
    expect(
      screen.getByText(appLabels.indicateurRetirerAnneeTitre)
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurRetirerAnneeConfirmer,
      })
    );

    expect(onRemoveYear).toHaveBeenCalledWith(toYear(2040));
  });

  it("n'affiche pas le bouton retirer quand canRemove est faux", () => {
    render(
      <table>
        <thead>
          <tr>
            <YearColumnHeader
              year={toYear(2040)}
              isReference={false}
              onRemoveYear={vi.fn()}
              canRemove={false}
              hasValues={false}
            />
          </tr>
        </thead>
      </table>
    );

    expect(
      screen.queryByRole('button', {
        name: appLabels.indicateurRetirerAnnee(2040),
      })
    ).toBeNull();
  });
});
