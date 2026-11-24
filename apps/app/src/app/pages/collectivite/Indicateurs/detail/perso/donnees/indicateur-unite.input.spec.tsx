import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IndicateurUniteInput } from './indicateur-unite.input';

const getUniteInput = (): HTMLInputElement =>
  screen.getByRole('textbox', {
    name: new RegExp(`^${appLabels.indicateurUnite}`),
  });

const changeUnite = (unite: string): void => {
  fireEvent.change(getUniteInput(), { target: { value: unite } });
  fireEvent.blur(getUniteInput());
};

describe('IndicateurUniteInput', () => {
  it("enregistre l'unité saisie quand le champ perd le focus", () => {
    const updateUnite = vi.fn();
    render(
      <IndicateurUniteInput
        titre="Déchets collectés"
        unite="t"
        hasSousIndicateurs={false}
        updateUnite={updateUnite}
      />
    );

    changeUnite('kg');

    expect(updateUnite).toHaveBeenCalledWith('kg');
  });

  it("désactive le champ et explique qu'il s'appuie sur l'unité du parent pour un sous-indicateur", () => {
    render(
      <IndicateurUniteInput
        titre="Verre"
        unite="t"
        hasSousIndicateurs={false}
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
    render(
      <IndicateurUniteInput
        titre="Déchets collectés"
        unite="t"
        hasSousIndicateurs={false}
        updateUnite={vi.fn()}
      />
    );

    expect(getUniteInput().disabled).toBe(false);
    expect(screen.queryByText(/s'appuie sur l'unité/)).toBeNull();
  });

  it("garde le champ désactivé sans le droit de modifier, sans prétendre qu'il vient du parent", () => {
    render(
      <IndicateurUniteInput
        titre="Déchets collectés"
        unite="t"
        hasSousIndicateurs={false}
        disabled
        updateUnite={vi.fn()}
      />
    );

    expect(getUniteInput().disabled).toBe(true);
    expect(screen.queryByText(/s'appuie sur l'unité/)).toBeNull();
  });

  it("avertit que tous les sous-indicateurs seront mis à jour avant de changer l'unité, et l'enregistre à la confirmation", () => {
    const updateUnite = vi.fn();
    render(
      <IndicateurUniteInput
        titre="Déchets collectés"
        unite="t"
        hasSousIndicateurs
        updateUnite={updateUnite}
      />
    );

    changeUnite('kg');

    expect(updateUnite).not.toHaveBeenCalled();
    expect(
      screen.getByText(appLabels.indicateurUniteChangementTitre)
    ).toBeDefined();
    expect(screen.getByText('Déchets collectés')).toBeDefined();
    expect(
      screen.getByText(appLabels.indicateurUniteChangementSousIndicateursTitre)
    ).toBeDefined();
    expect(
      screen.getByText(
        appLabels.indicateurUniteChangementSousIndicateursDescription
      )
    ).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: appLabels.confirmer }));

    expect(updateUnite).toHaveBeenCalledTimes(1);
    expect(updateUnite).toHaveBeenCalledWith('kg');
    expect(getUniteInput().value).toBe('kg');
  });

  it("remet l'unité actuelle et n'enregistre rien quand on annule le changement", () => {
    const updateUnite = vi.fn();
    render(
      <IndicateurUniteInput
        titre="Déchets collectés"
        unite="t"
        hasSousIndicateurs
        updateUnite={updateUnite}
      />
    );

    changeUnite('kg');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(updateUnite).not.toHaveBeenCalled();
    expect(getUniteInput().value).toBe('t');
  });

  it("ne demande pas confirmation quand l'unité n'a pas changé", () => {
    render(
      <IndicateurUniteInput
        titre="Déchets collectés"
        unite="t"
        hasSousIndicateurs
        updateUnite={vi.fn()}
      />
    );

    changeUnite('t');

    expect(
      screen.queryByText(
        appLabels.indicateurUniteChangementSousIndicateursTitre
      )
    ).toBeNull();
  });
});
