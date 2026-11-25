import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurUniteInput } from './indicateur-unite.input';

const getUniteInput = (): HTMLInputElement =>
  screen.getByRole('textbox', {
    name: new RegExp(`^${appLabels.indicateurUnite}`),
  });

describe('IndicateurUniteInput', () => {
  it("enregistre l'unité saisie quand le champ perd le focus", () => {
    const updateUnite = vi.fn();
    render(<IndicateurUniteInput unite="t" updateUnite={updateUnite} />);

    fireEvent.change(getUniteInput(), { target: { value: 'kg' } });
    fireEvent.blur(getUniteInput());

    expect(updateUnite).toHaveBeenCalledWith('kg');
  });

  it("désactive le champ et explique qu'il s'appuie sur l'unité du parent pour un sous-indicateur", () => {
    render(
      <IndicateurUniteInput
        unite="t"
        parentTitre="Déchets"
        updateUnite={vi.fn()}
      />
    );

    expect(getUniteInput().disabled).toBe(true);
    expect(
      screen.getByText(appLabels.indicateurUniteDuParent({ parent: 'Déchets' }))
    ).toBeDefined();
  });

  it("garde le champ modifiable et sans explication quand l'indicateur n'a pas de parent", () => {
    render(<IndicateurUniteInput unite="t" updateUnite={vi.fn()} />);

    expect(getUniteInput().disabled).toBe(false);
    expect(screen.queryByText(/s'appuie sur l'unité/)).toBeNull();
  });

  it("garde le champ désactivé sans le droit de modifier, sans prétendre qu'il vient du parent", () => {
    render(<IndicateurUniteInput unite="t" disabled updateUnite={vi.fn()} />);

    expect(getUniteInput().disabled).toBe(true);
    expect(screen.queryByText(/s'appuie sur l'unité/)).toBeNull();
  });
});
