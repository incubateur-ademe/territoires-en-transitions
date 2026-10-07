import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { ReferenceYearField } from './reference-year-field';

const currentYear = new Date().getFullYear();
const referenceYear = Math.min(2020, currentYear);
const years = [referenceYear, Math.min(2024, currentYear)];

const openField = () => {
  fireEvent.click(
    screen.getByRole('button', {
      name: appLabels.indicateurAnneeReferenceChamp,
    })
  );
  return screen.getByRole('textbox', {
    name: appLabels.indicateurAnneeReferenceChamp,
  });
};

/** Reproduit le clic à côté du champ, qui referme l'édition en ligne. */
const clickOutside = () => {
  fireEvent.pointerDown(document.body);
  fireEvent.mouseDown(document.body);
  fireEvent.mouseUp(document.body);
  fireEvent.click(document.body);
};

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
  it('enregistre l’année saisie quand on clique à côté du champ', () => {
    const onReferenceYearChange = vi.fn();
    render(
      <ReferenceYearField
        year={referenceYear}
        years={years}
        onReferenceYearChange={onReferenceYearChange}
      />
    );

    const input = openField();
    fireEvent.change(input, { target: { value: '2018' } });
    clickOutside();

    expect(onReferenceYearChange).toHaveBeenCalledWith(2018);
  });

  it('abandonne une année invalide quand on clique à côté du champ', () => {
    const onReferenceYearChange = vi.fn();
    render(
      <ReferenceYearField
        year={referenceYear}
        years={years}
        onReferenceYearChange={onReferenceYearChange}
      />
    );

    const input = openField();
    fireEvent.change(input, { target: { value: '12' } });
    clickOutside();

    expect(onReferenceYearChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', {
        name: appLabels.indicateurAnneeReferenceChamp,
      }).textContent
    ).toBe(String(referenceYear));
  });

  it('n’enregistre pas l’année saisie après Échap', () => {
    const onReferenceYearChange = vi.fn();
    render(
      <ReferenceYearField
        year={referenceYear}
        years={years}
        onReferenceYearChange={onReferenceYearChange}
      />
    );

    const input = openField();
    fireEvent.change(input, { target: { value: '2018' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onReferenceYearChange).not.toHaveBeenCalled();
  });

  it('n’appelle qu’une fois le callback après Entrée', () => {
    const onReferenceYearChange = vi.fn();
    render(
      <ReferenceYearField
        year={referenceYear}
        years={years}
        onReferenceYearChange={onReferenceYearChange}
      />
    );

    const input = openField();
    fireEvent.change(input, { target: { value: '2018' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onReferenceYearChange).toHaveBeenCalledTimes(1);
  });
});
