import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { ReferenceYearField } from './reference-year-field';

const currentYear = new Date().getFullYear();
const referenceYear = Math.min(2020, currentYear);
const years = [referenceYear, Math.min(2024, currentYear)];

describe('ReferenceYearField', () => {
  it('affiche l’année de référence', () => {
    render(
      <ReferenceYearField
        year={referenceYear}
        years={years}
        onReferenceYearChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', {
        name: appLabels.indicateurAnneeReferenceChamp,
      }).textContent
    ).toBe(String(referenceYear));
  });

  it('appelle onReferenceYearChange après Entrée avec une année valide', () => {
    const onReferenceYearChange = vi.fn();
    render(
      <ReferenceYearField
        year={referenceYear}
        years={years}
        onReferenceYearChange={onReferenceYearChange}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurAnneeReferenceChamp,
      })
    );
    const input = screen.getByRole('textbox', {
      name: appLabels.indicateurAnneeReferenceChamp,
    });
    fireEvent.change(input, { target: { value: '2018' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onReferenceYearChange).toHaveBeenCalledWith(2018);
  });

  it("affiche un placeholder tant que l'année n'est pas saisie", () => {
    render(
      <ReferenceYearField
        year={null}
        years={years}
        onReferenceYearChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', {
        name: appLabels.indicateurAnneeReferenceChamp,
      }).textContent
    ).toBe(appLabels.indicateurAnneeReferencePlaceholder);
  });

  it('n’appelle pas le callback quand l’année est inchangée', () => {
    const onReferenceYearChange = vi.fn();
    render(
      <ReferenceYearField
        year={referenceYear}
        years={years}
        onReferenceYearChange={onReferenceYearChange}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.indicateurAnneeReferenceChamp,
      })
    );
    const input = screen.getByRole('textbox', {
      name: appLabels.indicateurAnneeReferenceChamp,
    });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });
});
