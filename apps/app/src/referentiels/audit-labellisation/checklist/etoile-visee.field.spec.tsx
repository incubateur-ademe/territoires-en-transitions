import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EtoileViseeField, toEtoileState } from './etoile-visee.field';

const LEGEND = 'Quelle étoile visez-vous ?';

const getEtoileRadio = (name: string): HTMLInputElement => {
  const radio = screen.getByRole('radio', { name });
  if (!(radio instanceof HTMLInputElement)) {
    throw new Error(`radio inattendu pour « ${name} »`);
  }
  return radio;
};

describe('EtoileViseeField', () => {
  it('sans étoile obtenue : propose les étoiles 1 à 5 dans un groupe nommé par la question', () => {
    render(
      <EtoileViseeField value={2} etoilesObtenues={0} onChange={vi.fn()} />
    );

    expect(
      screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))
    ).toEqual(['1', '2', '3', '4', '5']);
    expect(screen.getByRole('radiogroup', { name: LEGEND })).toBeDefined();
  });

  it("première étoile obtenue : elle n'est plus proposée, puisqu'elle ne se renouvelle pas", () => {
    render(
      <EtoileViseeField value={2} etoilesObtenues={1} onChange={vi.fn()} />
    );

    expect(
      screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))
    ).toEqual(['2', '3', '4', '5']);
  });

  it("coche l'étoile évaluée par la checklist", () => {
    render(
      <EtoileViseeField value={4} etoilesObtenues={0} onChange={vi.fn()} />
    );

    expect(getEtoileRadio('quatrième étoile').checked).toBe(true);
    expect(getEtoileRadio('troisième étoile').checked).toBe(false);
  });

  it("coche la première étoile quand la checklist l'évalue", () => {
    render(
      <EtoileViseeField value={1} etoilesObtenues={0} onChange={vi.fn()} />
    );

    expect(getEtoileRadio('première étoile').checked).toBe(true);
  });

  it("émet l'étoile cliquée", () => {
    const onChange = vi.fn();
    render(
      <EtoileViseeField value={4} etoilesObtenues={0} onChange={onChange} />
    );

    fireEvent.click(getEtoileRadio('troisième étoile'));

    expect(onChange).toHaveBeenCalledWith(3);
  });
});

describe('EtoileViseeField — étoiles déjà obtenues', () => {
  it('signale comme déjà obtenues les étoiles de la labellisation en cours, pas les suivantes', () => {
    render(
      <EtoileViseeField value={4} etoilesObtenues={3} onChange={vi.fn()} />
    );

    expect(
      [
        'deuxième étoile, déjà obtenue',
        'troisième étoile, déjà obtenue',
        'quatrième étoile',
        'cinquième étoile',
      ].map((name) => screen.getByRole('radio', { name }).getAttribute('value'))
    ).toEqual(['2', '3', '4', '5']);
  });
});

describe('toEtoileState', () => {
  it("sans survol : pleines jusqu'à l'étoile choisie, vides au-delà", () => {
    expect(
      ([2, 3, 4, 5] as const).map((star) =>
        toEtoileState({ star, value: 3, hoveredStar: null })
      )
    ).toEqual(['selected', 'selected', 'empty', 'empty']);
  });

  it("survol au-delà de l'étoile choisie : les étoiles ajoutées sont en aperçu", () => {
    expect(
      ([2, 3, 4, 5] as const).map((star) =>
        toEtoileState({ star, value: 3, hoveredStar: 4 })
      )
    ).toEqual(['selected', 'selected', 'hovered', 'empty']);
  });

  it("survol en deçà de l'étoile choisie : les étoiles au-delà du survol se vident", () => {
    expect(
      ([2, 3, 4, 5] as const).map((star) =>
        toEtoileState({ star, value: 4, hoveredStar: 2 })
      )
    ).toEqual(['selected', 'empty', 'empty', 'empty']);
  });
});
